using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using MyProject.Dto;
using MyProject.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialReceiptsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly MaterialReceiptInfoService _receiptService;
        private readonly IWebHostEnvironment _environment; // Thêm dòng này

        public MaterialReceiptsController(AppDbContext context, MaterialReceiptInfoService receiptService, IWebHostEnvironment environment)
        {
            _context = context;
            _receiptService = receiptService;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaterialReceiptInfoDto>>> GetMaterialReceipts()
        {
            var results = await _receiptService.GetAllReceiptsAsync();
            return Ok(results);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialReceiptInfoDto>> GetMaterialReceipt(int id)
        {
            var receipt = await _receiptService.GetReceiptByIdAsync(id);
            if (receipt == null) return NotFound();
            return receipt;
        }

        [HttpPost]
        public async Task<ActionResult<MaterialReceiptInfoDto>> PostMaterialReceipt([FromForm] CreateMaterialReceiptDto receiptDto)
        {
            var receipt = await _receiptService.CreateReceiptAsync(receiptDto);

            return CreatedAtAction(nameof(GetMaterialReceipt), new { id = receipt.Id }, receipt);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaterialReceipt(int id, [FromForm] CreateMaterialReceiptDto receiptDto)
        {
            if (id != receiptDto.Id) return BadRequest();

            var updatedReceipt = await _receiptService.UpdateReceiptAsync(id, receiptDto);

            if (updatedReceipt == null) return NotFound();

            return Ok(updatedReceipt);
        }

        [HttpPost("{id}/receive")]
        public async Task<IActionResult> ReceiveMaterialReceipt(int id, [FromBody] ReceiveMaterialReceiptDto receiptDto)
        {
            try
            {
                var updatedReceipt = await _receiptService.ReceiveReceiptAsync(id, receiptDto);
                if (updatedReceipt == null) return NotFound();

                return Ok(updatedReceipt);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/wrong-info")]
        public async Task<IActionResult> MarkMaterialReceiptWrongInfo(int id)
        {
            var updatedReceipt = await _receiptService.MarkWrongInfoAsync(id);
            if (updatedReceipt == null) return NotFound();

            return Ok(updatedReceipt);
        }

        [HttpGet("{id}/export-inspection-report")]
        public async Task<IActionResult> ExportInspectionReport(int id)
        {
            var pdfBytes = await _receiptService.ExportInspectionReportPdfAsync(id);
            if (pdfBytes == null) return NotFound("Không tìm thấy dữ liệu hoặc lỗi trong quá trình tạo file.");

            return File(pdfBytes, "application/pdf", "Bien_ban_kiem_nghiem.pdf");
        }

        [HttpGet("files/{materialReceiptCode}/{type}")]
        public async Task<IActionResult> GetFile(string materialReceiptCode, string type)
        {
            try
            {
                var (stream, contentType) = await _receiptService.GetFirebaseFileAsync(materialReceiptCode, type);
                return File(stream, contentType);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = "Không tìm thấy file trên Firebase", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterialReceipt(int id)
        {
            var receipt = await _context.MaterialReceipts.FindAsync(id);
            if (receipt == null) return NotFound();

            // Tìm và xóa các lô hàng (batches) liên quan trong bảng MaterialReceiptBatches
            var batches = await _context.MaterialReceiptBatches
                .Where(b => b.MaterialReceiptId == id)
                .ToListAsync();
            _context.MaterialReceiptBatches.RemoveRange(batches);

            _context.MaterialReceipts.Remove(receipt);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MaterialReceiptExists(int id)
        {
            return _context.MaterialReceipts.Any(e => e.Id == id);
        }
    }
}
