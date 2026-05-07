using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Models;

namespace MyProject.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehouseStatusesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WarehouseStatusesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/WarehouseStatuses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseStatus>>> GetWarehouseStatuses()
        {
            return await _context.WarehouseStatuses.ToListAsync();
        }

        // GET: api/WarehouseStatuses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseStatus>> GetWarehouseStatus(int id)
        {
            var warehouseStatus = await _context.WarehouseStatuses.FindAsync(id);

            if (warehouseStatus == null)
            {
                return NotFound();
            }

            return warehouseStatus;
        }

        // POST: api/WarehouseStatuses
        [HttpPost]
        public async Task<ActionResult<WarehouseStatus>> PostWarehouseStatus(WarehouseStatus warehouseStatus)
        {
            _context.WarehouseStatuses.Add(warehouseStatus);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetWarehouseStatus", new { id = warehouseStatus.ID }, warehouseStatus);
        }

        // PUT: api/WarehouseStatuses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouseStatus(int id, WarehouseStatus warehouseStatus)
        {
            if (id != warehouseStatus.ID)
            {
                return BadRequest();
            }

            _context.Entry(warehouseStatus).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseStatusExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/WarehouseStatuses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouseStatus(int id)
        {
            var warehouseStatus = await _context.WarehouseStatuses.FindAsync(id);
            if (warehouseStatus == null)
            {
                return NotFound();
            }

            _context.WarehouseStatuses.Remove(warehouseStatus);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WarehouseStatusExists(int id)
        {
            return _context.WarehouseStatuses.Any(e => e.ID == id);
        }
    }
}