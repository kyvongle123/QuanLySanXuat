using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System.IO;

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

        [HttpGet("import/units")]
        public IActionResult DownloadUnitImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "UnitTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập đơn vị tính." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "UnitTemplate.xlsx"
            );
        }

        [HttpGet("import/boms")]
        public IActionResult DownloadBomImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "BOMTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập định mức." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "BOMTemplate.xlsx"
            );
        }

        [HttpGet("import/stages")]
        public IActionResult DownloadStageImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "StageTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập công đoạn." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "StageTemplate.xlsx"
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

        [HttpGet("import/production-sections")]
        public IActionResult DownloadProductionSectionImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "ProductionSectionTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập tổ sản xuất." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "ProductionSectionTemplate.xlsx"
            );
        }

        [HttpGet("import/suppliers")]
        public IActionResult DownloadSupplierImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "SupplierTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập nhà cung cấp." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "SupplierTemplate.xlsx"
            );
        }

        [HttpGet("import/customers")]
        public IActionResult DownloadCustomerImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "CustomerTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập khách hàng." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "CustomerTemplate.xlsx"
            );
        }

        [HttpGet("import/users")]
        public IActionResult DownloadUserImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "UserTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập người dùng." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "UserTemplate.xlsx"
            );
        }

        [HttpGet("import/roles")]
        public IActionResult DownloadRoleImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "RoleTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập chức vụ." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "RoleTemplate.xlsx"
            );
        }

        [HttpGet("import/material-receipts")]
        public IActionResult DownloadMaterialReceiptImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "MaterialReceiptTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập phiếu nhập nguyên liệu." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "MaterialReceiptTemplate.xlsx"
            );
        }

        [HttpGet("import/transport-vehicles")]
        public IActionResult DownloadTransportVehicleImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "TransportVehicleTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập xe vận chuyển." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "TransportVehicleTemplate.xlsx"
            );
        }

        [HttpGet("import/transport-routes")]
        public IActionResult DownloadTransportRouteImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "TransportRouteTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập xe vận chuyển." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "TransportRouteTemplate.xlsx"
            );
        }

        [HttpGet("import/drivers")]
        public IActionResult DownloadDriverImportTemplate()
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "ImportTemplate",
                "DriverTemplate.xlsx"
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy file mẫu nhập tài xế." });
            }

            var stream = System.IO.File.OpenRead(filePath);
            return File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "DriverTemplate.xlsx"
            );
        }
    }
}
