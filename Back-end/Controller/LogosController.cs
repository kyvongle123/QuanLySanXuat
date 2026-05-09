using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class LogosController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        public LogosController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [HttpGet("hanghoa")]
        public IActionResult GetHangHoaLogo()
        {
            // Thử lấy đường dẫn từ ContentRootPath (thư mục gốc của project Back-end)
            string contentPath = _environment.ContentRootPath;
            
            // Xây dựng đường dẫn tuyệt đối đến file
            string filePath = Path.Combine(contentPath, "wwwroot", "Public", "WebLogo", "hanghoa.png");

            // Nếu không tìm thấy, thử dùng WebRootPath (trong trường hợp đã cấu hình StaticFiles)
            if (!System.IO.File.Exists(filePath) && !string.IsNullOrEmpty(_environment.WebRootPath))
            {
                filePath = Path.Combine(_environment.WebRootPath, "Public", "WebLogo", "hanghoa.png");
            }

            // Chuẩn hóa đường dẫn để tránh lỗi dấu gạch chéo trên các hệ điều hành khác nhau
            filePath = Path.GetFullPath(filePath);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { 
                    message = "Không tìm thấy file logo tại đường dẫn vật lý.",
                    pathTested = filePath 
                });
            }

            // Mở file và trả về dưới dạng file stream với định dạng image/png
            var image = System.IO.File.OpenRead(filePath);
            return File(image, "image/png");
        }
    }
}