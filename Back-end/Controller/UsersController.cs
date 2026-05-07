using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using Microsoft.AspNetCore.Hosting;
using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using BCrypt.Net;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

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
                user.UserAvatar = SaveAvatar(user.Id, user.Name, user.UserAvatar);
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
                user.UserAvatar = SaveAvatar(user.Id, user.Name, user.UserAvatar);
            }
            else
            {
                user.UserAvatar = existing.UserAvatar;
            }

            user.UpdatedAt = DateTime.Now;
            user.CreatedAt = existing.CreatedAt;
            _context.Entry(user).State = EntityState.Modified;
            _context.Entry(user).Property(x => x.CreatedAt).IsModified = false;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        private string SaveAvatar(int userId, string userName, string base64String)
        {
            try
            {
                // Giải mã chuỗi Base64
                var parts = base64String.Split(',');
                string base64Data = parts.Length > 1 ? parts[1] : parts[0];
                byte[] imageBytes = Convert.FromBase64String(base64Data);

                // Làm sạch tên người dùng để tránh ký tự lỗi khi tạo thư mục (vd: /, :, *)
                string safeUserName = string.Join("_", userName.Split(Path.GetInvalidFileNameChars()));

                // Cấu trúc thư mục: Public/UserAvatar/{Id} - {Name}
                string folderName = $"{userId} - {safeUserName}";
                string subPath = Path.Combine("Public", "UserAvatar", folderName);
                
                // Xử lý nếu WebRootPath bị null (thường do thiếu thư mục wwwroot)
                string rootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(rootPath))
                {
                    rootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                }

                string uploadPath = Path.Combine(rootPath, subPath);

                if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                // Tên tệp: {Id} - {Name}.png
                string fileName = $"{userId} - {safeUserName}.png";
                string fullPath = Path.Combine(uploadPath, fileName);

                // LOG ĐƯỜNG DẪN TUYỆT ĐỐI ĐỂ KIỂM TRA
                Console.WriteLine($"[DEBUG] Đang lưu ảnh tại: {fullPath}");

                System.IO.File.WriteAllBytes(fullPath, imageBytes);

                // Trả về đường dẫn tương đối để lưu vào DB và hiển thị trên web
                return $"/{subPath}/{fileName}".Replace("\\", "/");
            }
            catch (Exception ex) 
            { 
                Console.WriteLine($"[ERROR] SaveAvatar: {ex.Message}");
                return null; 
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}