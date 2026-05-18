using Microsoft.EntityFrameworkCore;
using Google.Cloud.Storage.V1;
using Google.Apis.Auth.OAuth2;
using Aspose.Words;
using MiniSoftware;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using MyProject.Dto;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MyProject.Service
{
    public class MaterialReceiptInfoService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment; // Thêm dòng này
        private const string FirebaseBucketName = "quanlysanxuat-cb353.firebasestorage.app";

        public MaterialReceiptInfoService(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;

            // Nạp License Aspose nếu có để xóa bỏ watermark "Evaluation Copy"
            try
            {
                string licensePath = Path.Combine(_environment.ContentRootPath, "Aspose.Words.lic");
                if (File.Exists(licensePath))
                {
                    Aspose.Words.License license = new Aspose.Words.License();
                    license.SetLicense(licensePath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARNING] Không thể kích hoạt Aspose License: {ex.Message}");
            }
        }

        public async Task<IEnumerable<MaterialReceiptInfoDto>> GetAllReceiptsAsync()
        {
            var receipts = await _context.MaterialReceipts
                .Include(r => r.MaterialReceiptBatches)
                .ToListAsync();

            // Lấy danh sách ID của các phiếu nhập
            var receiptIds = receipts.Select(r => r.Id).ToList();

            // Lấy danh sách người dùng được gán cho các phiếu nhập này (lấy theo lô để tối ưu)
            var inspectorMap = (await _context.Users
                .Where(u => u.MaterialReceipt != null && receiptIds.Contains(u.MaterialReceipt.Value))
                .Select(u => new { u.Id, u.MaterialReceipt })
                .ToListAsync())
                .GroupBy(u => u.MaterialReceipt!.Value)
                .ToDictionary(g => g.Key, g => g.Select(u => u.Id).ToList());

            return receipts.Select(r => {
                var dto = MapToInfoDto(r);
                // Gán danh sách ID người dùng vào InspectorPanel nếu tồn tại trong Map
                dto.InspectorPanel = inspectorMap.ContainsKey(r.Id) ? inspectorMap[r.Id] : new List<int>();
                return dto;
            }).ToList();
        }

        public async Task<MaterialReceiptInfoDto?> GetReceiptByIdAsync(int id)
        {
            var receipt = await _context.MaterialReceipts
                .Include(r => r.MaterialReceiptBatches)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (receipt == null) return null;
            
            var dto = MapToInfoDto(receipt);
            // Lấy danh sách ID người kiểm nghiệm cho phiếu nhập cụ thể
            dto.InspectorPanel = await _context.Users
                .Where(u => u.MaterialReceipt == id)
                .Select(u => u.Id)
                .ToListAsync();

            return dto;
        }

        public async Task<MaterialReceiptInfoDto> CreateReceiptAsync(CreateMaterialReceiptDto dto)
        {
            // 1. Xử lý upload tệp tin trước để lấy đường dẫn API lưu trữ
            string? certificateOfOriginPath = null;
            string? certificateOfQualityPath = null;
            string? inspectationReportPath = null;

            if (dto.CertificateOfOriginFile != null)
                certificateOfOriginPath = SaveUploadedFile(dto.MaterialReceiptCode, dto.CertificateOfOriginFile, "CertificateOfOrigin", "CO");
            if (dto.CertificateOfQualityFile != null)
                certificateOfQualityPath = SaveUploadedFile(dto.MaterialReceiptCode, dto.CertificateOfQualityFile, "CertificateOfQuality", "CQ");
            if (dto.InspectationReportFile != null)
                inspectationReportPath = SaveUploadedFile(dto.MaterialReceiptCode, dto.InspectationReportFile, "InspectationReports", "IR");

            var receipt = new MaterialReceipt
            {
                MaterialReceiptCode = dto.MaterialReceiptCode,
                DeliveryNoteNumber = dto.DeliveryNoteNumber,
                ReceivingDate = dto.ReceivingDate,
                ExpiredDate = dto.ExpiredDate,
                QualityStatus = dto.QualityStatus,
                Warehouse = dto.Warehouse,
                Supplier = dto.Supplier,
                SpecialStorageCondition = dto.SpecialStorageCondition,
                Receiver = dto.Receiver,
                CertificateOfOrigin = certificateOfOriginPath, // Gán đường dẫn đã upload
                CertificateOfQuality = certificateOfQualityPath, // Gán đường dẫn đã upload
                InspectationReport = inspectationReportPath,   // Gán đường dẫn đã upload
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.MaterialReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            foreach (var batchDto in dto.MaterialReceiptBatchList)
            {
                _context.MaterialReceiptBatches.Add(new MaterialReceiptBatch
                {
                    MaterialReceiptId = receipt.Id,
                    MaterialId = batchDto.MaterialId,
                    ShippedQuantity = batchDto.ShippedQuantity,
                    DeliveredQuantity = batchDto.DeliveredQuantity,
                    BatchCode = batchDto.BatchCode,
                    MFGDate = batchDto.MFGDate,
                    ExpiredDate = batchDto.ExpiredDate,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                });
            }

            await _context.SaveChangesAsync();

            // Cập nhật MaterialReceiptId cho các người dùng trong InspectorPanel
            if (dto.InspectorPanel != null && dto.InspectorPanel.Any())
            {
                var usersToUpdate = await _context.Users.Where(u => dto.InspectorPanel.Contains(u.Id)).ToListAsync();
                foreach (var user in usersToUpdate)
                {
                    user.MaterialReceipt = receipt.Id;
                }
                await _context.SaveChangesAsync(); // Lưu thay đổi cho bảng Users
            }
            var result = MapToInfoDto(receipt);
            result.InspectorPanel = dto.InspectorPanel;
            return result;
        }

        public async Task<MaterialReceiptInfoDto?> UpdateReceiptAsync(int id, CreateMaterialReceiptDto dto)
        {
            var receipt = await _context.MaterialReceipts
                .Include(r => r.MaterialReceiptBatches)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (receipt == null) return null;

            // Cập nhật file nếu có file mới
            if (dto.CertificateOfOriginFile != null)
                receipt.CertificateOfOrigin = SaveUploadedFile(dto.MaterialReceiptCode, dto.CertificateOfOriginFile, "CertificateOfOrigin", "CO");

            if (dto.CertificateOfQualityFile != null)
                receipt.CertificateOfQuality = SaveUploadedFile(dto.MaterialReceiptCode, dto.CertificateOfQualityFile, "CertificateOfQuality", "CQ");

            if (dto.InspectationReportFile != null)
                receipt.InspectationReport = SaveUploadedFile(dto.MaterialReceiptCode, dto.InspectationReportFile, "InspectationReports", "IR");

            // Cập nhật thông tin chung
            receipt.MaterialReceiptCode = dto.MaterialReceiptCode;
            receipt.DeliveryNoteNumber = dto.DeliveryNoteNumber;
            receipt.ReceivingDate = dto.ReceivingDate;
            receipt.ExpiredDate = dto.ExpiredDate;
            receipt.QualityStatus = dto.QualityStatus;
            receipt.Warehouse = dto.Warehouse;
            receipt.Supplier = dto.Supplier;
            receipt.SpecialStorageCondition = dto.SpecialStorageCondition;
            receipt.Receiver = dto.Receiver;
            receipt.UpdatedAt = DateTime.Now;

            // Xử lý cập nhật InspectorPanel
            // 1. Lấy danh sách người dùng hiện tại đang được gán cho phiếu nhập này
            var currentInspectorsForThisReceipt = await _context.Users
                .Where(u => u.MaterialReceipt == receipt.Id)
                .ToListAsync();

            // 2. Xóa liên kết (set MaterialReceiptId = null) cho những người dùng không còn trong InspectorPanel mới
            foreach (var inspector in currentInspectorsForThisReceipt)
            {
                if (dto.InspectorPanel == null || !dto.InspectorPanel.Contains(inspector.Id))
                {
                    inspector.MaterialReceipt = null;
                }
            }

            // 3. Cập nhật MaterialReceiptId cho những người dùng có trong InspectorPanel mới
            if (dto.InspectorPanel != null && dto.InspectorPanel.Any())
            {
                var usersToUpdate = await _context.Users.Where(u => dto.InspectorPanel.Contains(u.Id)).ToListAsync();
                foreach (var user in usersToUpdate)
                {
                    user.MaterialReceipt = receipt.Id;
                }
            }

            // Cập nhật danh sách lô hàng (Xóa cũ thêm mới)
            _context.MaterialReceiptBatches.RemoveRange(receipt.MaterialReceiptBatches);

            // Thêm các lô hàng mới
            foreach (var batchDto in dto.MaterialReceiptBatchList)
            {
                _context.MaterialReceiptBatches.Add(new MaterialReceiptBatch
                {
                    MaterialReceiptId = id,
                    MaterialId = batchDto.MaterialId,
                    ShippedQuantity = batchDto.ShippedQuantity,
                    DeliveredQuantity = batchDto.DeliveredQuantity,
                    BatchCode = batchDto.BatchCode,
                    MFGDate = batchDto.MFGDate,
                    ExpiredDate = batchDto.ExpiredDate,
                    CreatedAt = DateTime.Now, // Giả sử tạo mới khi cập nhật
                    UpdatedAt = DateTime.Now
                });
            }

            await _context.SaveChangesAsync();
            var result = MapToInfoDto(receipt);
            result.InspectorPanel = dto.InspectorPanel;
            return result;
        }

        public MaterialReceiptInfoDto MapToInfoDto(MaterialReceipt r) => new MaterialReceiptInfoDto
        {
            Id = r.Id,
            MaterialReceiptCode = r.MaterialReceiptCode,
            DeliveryNoteNumber = r.DeliveryNoteNumber,
            ReceivingDate = r.ReceivingDate,
            ExpiredDate = r.ExpiredDate,
            QualityStatus = r.QualityStatus,
            Warehouse = r.Warehouse,
            Supplier = r.Supplier,
            SpecialStorageCondition = r.SpecialStorageCondition,
            Receiver = r.Receiver,
            CreatedAt = r.CreatedAt,
            InspectationReport = r.InspectationReport,
            CertificateOfOrigin = r.CertificateOfOrigin,
            CertificateOfQuality = r.CertificateOfQuality,
            UpdatedAt = r.UpdatedAt,
            MaterialReceiptBatchList = r.MaterialReceiptBatches.Select(b => new MaterialReceiptBatchDto { // Ánh xạ đầy đủ các trường
                MaterialId = b.MaterialId,
                ShippedQuantity = b.ShippedQuantity,
                DeliveredQuantity = b.DeliveredQuantity,
                BatchCode = b.BatchCode,
                MFGDate = b.MFGDate,
                ExpiredDate = b.ExpiredDate
            }).ToList()
        };

        public async Task<byte[]?> ExportInspectionReportPdfAsync(int id)
        {
            // 1. Lấy dữ liệu đầy đủ
            var receipt = await _context.MaterialReceipts
                .Include(r => r.MaterialReceiptBatches)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (receipt == null) return null;

            var materialIds = receipt.MaterialReceiptBatches.Select(b => b.MaterialId).ToList();
            var materials = await _context.Materials.Where(m => materialIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id);
            var categories = await _context.MaterialCategories.ToDictionaryAsync(c => c.Id);
            
            var inspectors = await _context.Users.Where(u => u.MaterialReceipt == id).ToListAsync();
            var roles = await _context.Roles.ToDictionaryAsync(r => r.Id);
            var sections = await _context.ProductionSections.ToDictionaryAsync(s => s.ID);

            // 2. Phân loại thành viên ban kiểm nghiệm
            var manager = inspectors.FirstOrDefault(u => 
                roles.TryGetValue(u.Role ?? 0, out var role) && 
                role.Name.Trim().Equals("Trưởng ban kiểm nghiệm", StringComparison.OrdinalIgnoreCase));

            var commitee = inspectors.Where(u => u.Id != (manager?.Id ?? 0)).ToList();

            // 3. Chuẩn bị dữ liệu bằng Dictionary để đảm bảo tính ổn định tuyệt đối cho MiniWord
            var value = new Dictionary<string, object>
            {
                ["data.deliveriedNoteNumber"] = receipt.DeliveryNoteNumber ?? "...",
                ["data.deliveriedNote"] = "số vận đơn",
                ["data.deliveriedNoteNumber2"] = receipt.DeliveryNoteNumber ?? "...",
                ["data.day"] = receipt.ReceivingDate?.Day.ToString("00") ?? "..",
                ["data.month"] = receipt.ReceivingDate?.Month.ToString("00") ?? "..",
                ["data.year"] = receipt.ReceivingDate?.Year.ToString() ?? "....",
                ["data.day2"] = receipt.ReceivingDate?.Day.ToString("00") ?? "..",
                ["data.month2"] = receipt.ReceivingDate?.Month.ToString("00") ?? "..",
                
                ["data.year2"] = receipt.ReceivingDate?.Year.ToString() ?? "....",

                ["QCManager.name"] = manager?.Name ?? "---",
                ["QCManager.role"] = "Trưởng ban kiểm nghiệm",
                ["QCManager.productionSection"] = manager != null ? (sections.GetValueOrDefault(manager.ProductionSection ?? 0)?.Name ?? "---") : "---",

                // Gộp toàn bộ danh sách ủy viên vào một mảng duy nhất để MiniWord thực hiện vòng lặp (Section)
                ["commitee"] = commitee.Select(u => new
                {
                    name = u.Name ?? "---",
                    role = "Ủy viên",
                    productionSection = sections.GetValueOrDefault(u.ProductionSection ?? 0)?.Name ?? "---"
                }).ToList(),

                ["materials"] = receipt.MaterialReceiptBatches.Select((b, idx) =>
                {
                    var m = materials.GetValueOrDefault(b.MaterialId);
                    var cat = m != null ? categories.GetValueOrDefault(m.Name) : null;
                    return new {
                        index = idx + 1,
                        name = cat?.Name ?? "---",
                        code = b.BatchCode ?? "---",
                        inspectationMethod = "Cảm quan, đo lường",
                        unit = cat?.Unit ?? "---",
                        shippedQuantity = b.ShippedQuantity.ToString("N0"),
                        DeliveriedQuantity = b.DeliveredQuantity.ToString("N0"),
                        diff = (b.DeliveredQuantity - b.ShippedQuantity).ToString("N0")
                    };
                }).ToList()
            };


            // 4. Xử lý tệp
            string rootPath = _environment.ContentRootPath; // Lấy đường dẫn gốc của dự án
            string templatePath = Path.Combine(rootPath, "Templates", "InspectationMaterialTemplate.docx"); // Đường dẫn mới
            
            if (!System.IO.File.Exists(templatePath)) return null;

            try
            {
                // Lưu ý: Bạn cần cài đặt NuGet package: MiniWord và Aspose.Words
                using (var wordStream = new MemoryStream())
                {
                    // Bước A: Điền dữ liệu vào Word Template và lưu kết quả vào MemoryStream
                    MiniSoftware.MiniWord.SaveAsByTemplate(wordStream, templatePath, value);
                    wordStream.Position = 0;

                    // Bước B: Chuyển đổi dữ liệu Word từ Stream sang định dạng PDF
                    var doc = new Aspose.Words.Document(wordStream);
                    using (var pdfStream = new MemoryStream())
                    {
                        doc.Save(pdfStream, Aspose.Words.SaveFormat.Pdf);
                        return pdfStream.ToArray();
                    }
                }
            } catch (Exception ex) {
                Console.WriteLine($"Export Error: {ex.Message}");
                return null;
            }
        }

        public async Task<(Stream stream, string contentType)> GetFirebaseFileAsync(string materialReceiptCode, string type)
        {
            // 1. Tìm thông tin phiếu nhập trong DB dựa trên MaterialReceiptCode
            var receipt = await _context.MaterialReceipts
                .FirstOrDefaultAsync(r => r.MaterialReceiptCode == materialReceiptCode);

            if (receipt == null) throw new Exception("Không tìm thấy phiếu nhập với mã được cung cấp.");

            // 2. Xác định cột chứa đường dẫn tệp dựa trên Type yêu cầu
            string? apiPath = type switch
            {
                "CertificateOfOrigin" => receipt.CertificateOfOrigin,
                "CertificateOfQuality" => receipt.CertificateOfQuality,
                "InspectationReport" => receipt.InspectationReport,
                _ => throw new Exception("Loại tệp tin yêu cầu không hợp lệ.")
            };



            if (string.IsNullOrEmpty(apiPath)) throw new Exception("Phiếu nhập này không đính kèm tệp tin yêu cầu.");

            // 3. Trích xuất ObjectName (đường dẫn trên Firebase) từ chuỗi API Path lưu trong DB
            // Chuỗi lưu có dạng: "/api/MaterialReceipts/files/MaterialReceipts/SubFolder/FileName"
            string prefix = "/api/MaterialReceipts/files/";
            string objectName = apiPath.StartsWith(prefix) ? apiPath.Substring(prefix.Length) : apiPath;

            string credentialPath = Path.Combine(_environment.ContentRootPath, "firebase-key.json");
            var credential = GoogleCredential.FromFile(credentialPath);
            var storage = StorageClient.Create(credential);

            var stream = new MemoryStream();
            var obj = await storage.GetObjectAsync(FirebaseBucketName, objectName);
            await storage.DownloadObjectAsync(FirebaseBucketName, objectName, stream);
            stream.Position = 0;
            return (stream, obj.ContentType);
        }

        private string SaveUploadedFile(string materialReceiptCode, IFormFile file, string subFolder, string suffix)
        {
            if (file == null || file.Length == 0) return null;

            // Tạo tên file và đường dẫn (Object Name) trên Firebase Storage
            string fileName = $"{materialReceiptCode} - {suffix}{Path.GetExtension(file.FileName)}";
            string objectName = $"MaterialReceipts/{subFolder}/{fileName}";

            try
            {
                // Đường dẫn đến file JSON bạn vừa tải về
                string credentialPath =
    Environment.GetEnvironmentVariable("FIREBASE_CREDENTIAL_PATH")
    ?? Path.Combine(_environment.ContentRootPath, "firebase-key.json");
                
                // Khởi tạo thông tin xác thực từ file
                var credential = GoogleCredential.FromFile(credentialPath);

                // Khởi tạo StorageClient với credential đã nạp
                var storage = StorageClient.Create(credential);

                using (var stream = file.OpenReadStream())
                {
                    // Tải file lên Firebase
                    storage.UploadObject(FirebaseBucketName, objectName, file.ContentType, stream);
                }

                // Trả về đường dẫn API Backend của bạn. Frontend sẽ gọi vào đây để lấy file.
                return $"/api/MaterialReceipts/files/{objectName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] SaveUploadedFile to Firebase: {ex.Message}");
                return null;
            }
        }
    }
}