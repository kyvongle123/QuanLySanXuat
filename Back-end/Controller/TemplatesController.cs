using Microsoft.AspNetCore.Mvc;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class TemplatesController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        public TemplatesController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [HttpGet("import/items")]
        public IActionResult DownloadItemImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "ItemTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập thành phẩm." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "ItemTemplate.xlsx"
            );
        }

        [HttpGet("import/materials")]
        public IActionResult DownloadMaterialImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "MaterialTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập nguyên liệu." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "MaterialTemplate.xlsx"
            );
        }

        [HttpGet("import/warehouses")]
        public IActionResult DownloadWarehouseImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "WarehouseTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập nhà kho." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "WarehouseTemplate.xlsx"
            );
        }

        [HttpGet("import/warehouse-locations")]
        public IActionResult DownloadWarehouseLocationImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "WarehouseLocationTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập vị trí kho." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "WarehouseLocationTemplate.xlsx"
            );
        }
    }
}
