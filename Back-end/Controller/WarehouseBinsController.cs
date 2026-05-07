using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.API.Models;

namespace MyProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehouseBinsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WarehouseBinsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/WarehouseBins
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseBin>>> GetWarehouseBins()
        {
            return await _context.WarehouseBins.ToListAsync();
        }

        // GET: api/WarehouseBins/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseBin>> GetWarehouseBin(int id)
        {
            var warehouseBin = await _context.WarehouseBins.FindAsync(id);
            if (warehouseBin == null)
            {
                return NotFound();
            }
            return warehouseBin;
        }

        // POST: api/WarehouseBins
        [HttpPost]
        public async Task<ActionResult<WarehouseBin>> PostWarehouseBin(WarehouseBin warehouseBin)
        {
            _context.WarehouseBins.Add(warehouseBin);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWarehouseBin), new { id = warehouseBin.ID }, warehouseBin);
        }

        // PUT: api/WarehouseBins/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouseBin(int id, WarehouseBin warehouseBin)
        {
            if (id != warehouseBin.ID)
            {
                return BadRequest("ID không khớp.");
            }

            _context.Entry(warehouseBin).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseBinExists(id))
                {
                    return NotFound();
                }
                else throw;
            }
            return NoContent();
        }

        // DELETE: api/WarehouseBins/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouseBin(int id)
        {
            var warehouseBin = await _context.WarehouseBins.FindAsync(id);
            if (warehouseBin == null) return NotFound();
            _context.WarehouseBins.Remove(warehouseBin);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool WarehouseBinExists(int id)
        {
            return _context.WarehouseBins.Any(e => e.ID == id);
        }
    }
}