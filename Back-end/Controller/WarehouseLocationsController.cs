using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehouseLocationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WarehouseLocationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/WarehouseLocations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseLocation>>> GetWarehouseLocations()
        {
            return await _context.WarehouseLocations.ToListAsync();
        }

        // GET: api/WarehouseLocations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseLocation>> GetWarehouseLocation(int id)
        {
            var location = await _context.WarehouseLocations.FindAsync(id);
            if (location == null) return NotFound();
            return location;
        }

        // POST: api/WarehouseLocations
        [HttpPost]
        public async Task<ActionResult<WarehouseLocation>> PostWarehouseLocation(WarehouseLocation location)
        {
            _context.WarehouseLocations.Add(location);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWarehouseLocation), new { id = location.ID }, location);
        }

        // PUT: api/WarehouseLocations/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouseLocation(int id, WarehouseLocation location)
        {
            if (id != location.ID) return BadRequest("ID không khớp.");

            _context.Entry(location).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseLocationExists(id)) return NotFound();
                else throw;
            }

            return Ok(location);
        }

        // DELETE: api/WarehouseLocations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouseLocation(int id)
        {
            var location = await _context.WarehouseLocations.FindAsync(id);
            if (location == null) return NotFound();

            _context.WarehouseLocations.Remove(location);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WarehouseLocationExists(int id)
        {
            return _context.WarehouseLocations.Any(e => e.ID == id);
        }
    }
}