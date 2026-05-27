using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using Microsoft.AspNetCore.Hosting;
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BCrypt.Net;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private const string UserCodePrefix = "ND00";
        private const int MaxCreateUserCodeAttempts = 10;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private const string FirebaseBucketName = "quanlysanxuat-cb353.firebasestorage.app";

        public UsersController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers() => await _context.Users.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user == null ? NotFound() : user;
        }

        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            var hasProvidedUserCode = !string.IsNullOrWhiteSpace(user.UserCode);
            var plainPassword = user.Password;
            if (DateTime.Now.Ticks >= 0)
            {
                for (var attempt = 0; attempt < MaxCreateUserCodeAttempts; attempt++)
                {
                    user.Password = plainPassword;

                    if (!string.IsNullOrEmpty(user.Password))
                    {
                        user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                    }

                    if (!hasProvidedUserCode)
                    {
                        user.UserCode = await GenerateNextUserCodeAsync();
                    }
                    else
                    {
                        user.UserCode = user.UserCode?.Trim();
                    }

                    await using var transaction = await _context.Database.BeginTransactionAsync();

                    user.CreatedAt = DateTime.Now;
                    user.UpdatedAt = DateTime.Now;
                    _context.Users.Add(user);

                    try
                    {
                        await _context.SaveChangesAsync();

                        if (!string.IsNullOrEmpty(user.UserAvatar) && user.UserAvatar.Contains("base64,"))
                        {
                            user.UserAvatar = SaveAvatar(user.Id, user.Name ?? $"User_{user.Id}", user.UserAvatar);
                            await _context.SaveChangesAsync();
                        }

                        await transaction.CommitAsync();

                        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
                    }
                    catch (DbUpdateException ex) when (IsUniqueUserCodeException(ex))
                    {
                        await transaction.RollbackAsync();
                        _context.Entry(user).State = EntityState.Detached;
                        user.Id = 0;

                        if (hasProvidedUserCode || attempt >= MaxCreateUserCodeAttempts - 1)
                        {
                            return Conflict("UserCode đã tồn tại.");
                        }

                        user.UserCode = null;
                    }
                }

                return StatusCode(500, "Không thể sinh UserCode không trùng sau nhiều lần thử.");
            }
            // Mã hóa mật khẩu trước khi lưu
            if (!string.IsNullOrEmpty(user.Password))
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
            }

            user.CreatedAt = DateTime.Now;
            user.UpdatedAt = DateTime.Now;
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Lưu ảnh sau khi đã có Id người dùng
            if (!string.IsNullOrEmpty(user.UserAvatar) && user.UserAvatar.Contains("base64,"))
            {
                user.UserAvatar = SaveAvatar(user.Id, user.Name ?? $"User_{user.Id}", user.UserAvatar);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id) return BadRequest();
            var existing = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            if (existing == null) return NotFound();

            // Logic mã hóa mật khẩu khi chỉnh sửa:
            // Chỉ mã hóa nếu mật khẩu gửi lên khác với mật khẩu cũ (nghĩa là người dùng đã nhập mật khẩu mới)
            if (!string.IsNullOrEmpty(user.Password) && user.Password != existing.Password)
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
            }
            else
            {
                // Nếu không đổi mật khẩu, giữ nguyên hash cũ
                user.Password = existing.Password;
            }

            // Xử lý lưu ảnh đại diện nếu có thay đổi (gửi lên dạng base64)
            if (!string.IsNullOrEmpty(user.UserAvatar) && user.UserAvatar.Contains("base64,"))
            {
                user.UserAvatar = SaveAvatar(user.Id, user.Name ?? existing.Name ?? $"User_{user.Id}", user.UserAvatar) ?? existing.UserAvatar;
            }
            else
            {
                user.UserAvatar = existing.UserAvatar;
            }

            user.UpdatedAt = DateTime.Now;
            user.CreatedAt = existing.CreatedAt;
            user.UserCode = string.IsNullOrWhiteSpace(existing.UserCode)
                ? await GenerateNextUserCodeAsync()
                : existing.UserCode;
            _context.Entry(user).State = EntityState.Modified;
            _context.Entry(user).Property(x => x.CreatedAt).IsModified = false;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        private string SaveAvatar(int userId, string userName, string base64String)
        {
            try
            {
                var parts = base64String.Split(',');
                string contentType = "image/png";
                if (parts.Length > 1 && parts[0].StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                {
                    contentType = parts[0].Replace("data:", "").Split(';')[0];
                }

                string base64Data = parts.Length > 1 ? parts[1] : parts[0];
                byte[] imageBytes = Convert.FromBase64String(base64Data);

                using (var stream = new MemoryStream(imageBytes))
                {
                    return UploadAvatarToFirebase(userId, userName, stream, contentType);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] SaveAvatar: {ex.Message}");
                return null;
            }
        }

        [HttpPut("{id}/avatar")]
        [RequestSizeLimit(100 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 100 * 1024 * 1024)]
        public async Task<IActionResult> PutUserAvatar(int id, IFormFile avatar)
        {
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return NotFound();
            if (avatar == null || avatar.Length == 0) return BadRequest(new { message = "Vui lòng chọn ảnh đại diện." });
            if (!avatar.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Tệp tải lên phải là hình ảnh." });
            }

            try
            {
                using (var stream = avatar.OpenReadStream())
                {
                    var avatarPath = UploadAvatarToFirebase(id, existing.Name ?? $"User_{id}", stream, avatar.ContentType);
                    if (string.IsNullOrEmpty(avatarPath))
                    {
                        return StatusCode(500, new { message = "Không thể lưu ảnh đại diện." });
                    }

                    existing.UserAvatar = avatarPath;
                }

                existing.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(existing);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] PutUserAvatar: {ex.Message}");
                return StatusCode(500, new { message = "Không thể tải ảnh đại diện lên Firebase.", error = ex.Message });
            }
        }

        private string UploadAvatarToFirebase(int userId, string userName, Stream imageStream, string contentType)
        {
            string safeUserName = string.Join("_", userName.Split(Path.GetInvalidFileNameChars()));
            string folderName = $"{userId} - {safeUserName}";
            string extension = contentType switch
            {
                "image/jpeg" => ".jpg",
                "image/jpg" => ".jpg",
                "image/webp" => ".webp",
                "image/gif" => ".gif",
                _ => ".png"
            };
            string fileName = $"{userId} - {safeUserName}{extension}";
            string objectName = $"UserAvatar/{folderName}/{fileName}";

            string credentialPath = ResolveFirebaseCredentialPath();
            var credential = GoogleCredential.FromFile(credentialPath);
            var storage = StorageClient.Create(credential);

            storage.UploadObject(FirebaseBucketName, objectName, contentType, imageStream);

            return $"/api/Users/avatar/{objectName}";
        }

        private async Task DeleteAvatarFromFirebaseAsync(string? avatarPath)
        {
            var objectName = GetFirebaseAvatarObjectName(avatarPath);
            if (string.IsNullOrWhiteSpace(objectName)) return;

            try
            {
                string credentialPath = ResolveFirebaseCredentialPath();
                var credential = GoogleCredential.FromFile(credentialPath);
                var storage = StorageClient.Create(credential);

                await storage.DeleteObjectAsync(FirebaseBucketName, objectName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] DeleteAvatarFromFirebase: {ex.Message}");
            }
        }

        private string? GetFirebaseAvatarObjectName(string? avatarPath)
        {
            if (string.IsNullOrWhiteSpace(avatarPath)) return null;

            const string avatarRoute = "/api/Users/avatar/";
            var routeIndex = avatarPath.IndexOf(avatarRoute, StringComparison.OrdinalIgnoreCase);
            string objectName = routeIndex >= 0
                ? avatarPath.Substring(routeIndex + avatarRoute.Length)
                : avatarPath;

            if (!objectName.StartsWith("UserAvatar/", StringComparison.OrdinalIgnoreCase)) return null;

            return Uri.UnescapeDataString(objectName);
        }

        [HttpGet("avatar/{*objectName}")]
        public async Task<IActionResult> GetAvatar(string objectName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(objectName)) return NotFound();

                string credentialPath = ResolveFirebaseCredentialPath();
                var credential = GoogleCredential.FromFile(credentialPath);
                var storage = StorageClient.Create(credential);

                var stream = new MemoryStream();
                var obj = await storage.GetObjectAsync(FirebaseBucketName, objectName);
                await storage.DownloadObjectAsync(FirebaseBucketName, objectName, stream);
                stream.Position = 0;

                return File(stream, obj.ContentType);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = "Không tìm thấy avatar trên Firebase", error = ex.Message });
            }
        }

        private string ResolveFirebaseCredentialPath()
        {
            var configuredPath = Environment.GetEnvironmentVariable("FIREBASE_CREDENTIALS_JSON");
            if (!string.IsNullOrWhiteSpace(configuredPath))
            {
                return configuredPath;
            }

            var renderSecretPath = Path.Combine("/etc/secrets", "firebase-key.json");
            if (System.IO.File.Exists(renderSecretPath))
            {
                return renderSecretPath;
            }

            return Path.Combine(_environment.ContentRootPath, "firebase-key.json");
        }

        private async Task<string> GenerateNextUserCodeAsync()
        {
            var userCodes = await _context.Users
                .AsNoTracking()
                .Where(e => e.UserCode != null && e.UserCode.StartsWith(UserCodePrefix))
                .Select(e => e.UserCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var userCode in userCodes)
            {
                var numberText = userCode[UserCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{UserCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueUserCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Users_UserCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            await DeleteAvatarFromFirebaseAsync(user.UserAvatar);
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
