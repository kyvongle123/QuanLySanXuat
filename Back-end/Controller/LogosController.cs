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
            // Lấy đường dẫn thư mục root (wwwroot)
            string rootPath = _environment.WebRootPath;
            
            // Xử lý trường hợp WebRootPath bị null (thường xảy ra khi chạy môi trường dev nhất định)
            if (string.IsNullOrEmpty(rootPath))
            {
                rootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            // Đường dẫn tuyệt đối đến file hanghoa.png dựa trên cấu trúc bạn đã cung cấp
            string filePath = Path.Combine(rootPath, "Public", "WebLogo", "hanghoa.png");

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Logo file not found at: " + filePath });
            }

            // Mở file và trả về dưới dạng file stream với định dạng image/png
            var image = System.IO.File.OpenRead(filePath);
            return File(image, "image/png");
        }
    }
}