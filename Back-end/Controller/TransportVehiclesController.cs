using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransportVehiclesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TransportVehiclesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TransportVehicle>>> GetTransportVehicles() => await _context.TransportVehicles.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<TransportVehicle>> GetTransportVehicle(int id)
        {
            var vehicle = await _context.TransportVehicles.FindAsync(id);
            return vehicle == null ? NotFound() : vehicle;
        }

        [HttpPost]
        public async Task<ActionResult<TransportVehicle>> PostTransportVehicle(TransportVehicle vehicle)
        {
            _context.TransportVehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTransportVehicle), new { id = vehicle.Id }, vehicle);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTransportVehicle(int id, TransportVehicle vehicle)
        {
            if (id != vehicle.Id) return BadRequest();
            var existing = await _context.TransportVehicles.FindAsync(id);
            if (existing == null) return NotFound();

            _context.Entry(existing).CurrentValues.SetValues(vehicle);
            try {
                await _context.SaveChangesAsync();
            } catch (DbUpdateConcurrencyException) {
                throw;
            }
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransportVehicle(int id)
        {
            var vehicle = await _context.TransportVehicles.FindAsync(id);
            if (vehicle == null) return NotFound();
            _context.TransportVehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}