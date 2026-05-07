using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data; // Đảm bảo namespace này khớp với vị trí AppDbContext của bạn
using MyProject.API.Models; // Đảm bảo namespace này khớp với vị trí Models của bạn

namespace MyProject.API.Controllers
{
    [Route("api/[controller]")] // Endpoint sẽ là /api/WarehouseRacks
    [ApiController]
    public class WarehouseRacksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WarehouseRacksController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/WarehouseRacks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseRack>>> GetWarehouseRacks()
        {
            return await _context.WarehouseRacks.ToListAsync();
        }

        // GET: api/WarehouseRacks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseRack>> GetWarehouseRack(int id)
        {
            var warehouseRack = await _context.WarehouseRacks.FindAsync(id);
            if (warehouseRack == null)
            {
                return NotFound();
            }
            return warehouseRack;
        }

        // POST: api/WarehouseRacks
        [HttpPost]
        public async Task<ActionResult<WarehouseRack>> PostWarehouseRack(WarehouseRack warehouseRack)
        {
            _context.WarehouseRacks.Add(warehouseRack);
            await _context.SaveChangesAsync();
            // Trả về đối tượng vừa tạo cùng với URL để truy cập nó
            return CreatedAtAction(nameof(GetWarehouseRack), new { id = warehouseRack.ID }, warehouseRack);
        }

        // PUT: api/WarehouseRacks/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouseRack(int id, WarehouseRack warehouseRack)
        {
            if (id != warehouseRack.ID)
            {
                return BadRequest("ID trong URL không khớp với ID của đối tượng.");
            }

            _context.Entry(warehouseRack).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseRackExists(id))
                {
                    return NotFound("Không tìm thấy kệ kho với ID này.");
                }
                else
                {
                    throw; // Xử lý lỗi đồng thời khác
                }
            }
            return NoContent(); // Thành công nhưng không cần trả về nội dung
        }

        // DELETE: api/WarehouseRacks/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouseRack(int id)
        {
            var warehouseRack = await _context.WarehouseRacks.FindAsync(id);
            if (warehouseRack == null) return NotFound("Không tìm thấy kệ kho với ID này.");

            _context.WarehouseRacks.Remove(warehouseRack);
            await _context.SaveChangesAsync();

            return NoContent(); // Thành công nhưng không cần trả về nội dung
        }

        private bool WarehouseRackExists(int id)
        {
            return _context.WarehouseRacks.Any(e => e.ID == id);
        }
    }
}