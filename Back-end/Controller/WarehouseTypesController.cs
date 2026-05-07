using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.API.Models;

namespace MyProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehouseTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WarehouseTypesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/WarehouseTypes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseType>>> GetWarehouseTypes()
        {
            return await _context.WarehouseTypes.ToListAsync();
        }

        // GET: api/WarehouseTypes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseType>> GetWarehouseType(int id)
        {
            var warehouseType = await _context.WarehouseTypes.FindAsync(id);
            if (warehouseType == null) return NotFound();
            return warehouseType;
        }

        // POST: api/WarehouseTypes
        [HttpPost]
        public async Task<ActionResult<WarehouseType>> PostWarehouseType(WarehouseType warehouseType)
        {
            _context.WarehouseTypes.Add(warehouseType);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWarehouseType), new { id = warehouseType.ID }, warehouseType);
        }

        // PUT: api/WarehouseTypes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouseType(int id, WarehouseType warehouseType)
        {
            if (id != warehouseType.ID) return BadRequest();

            _context.Entry(warehouseType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseTypeExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // DELETE: api/WarehouseTypes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouseType(int id)
        {
            var warehouseType = await _context.WarehouseTypes.FindAsync(id);
            if (warehouseType == null) return NotFound();

            _context.WarehouseTypes.Remove(warehouseType);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WarehouseTypeExists(int id)
        {
            return _context.WarehouseTypes.Any(e => e.ID == id);
        }
    }
}