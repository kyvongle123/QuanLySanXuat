using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransportRoutesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TransportRoutesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TransportRoute>>> GetTransportRoutes() => await _context.TransportRoutes.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<TransportRoute>> GetTransportRoute(int id)
        {
            var route = await _context.TransportRoutes.FindAsync(id);
            return route == null ? NotFound() : route;
        }

        [HttpPost]
        public async Task<ActionResult<TransportRoute>> PostTransportRoute(TransportRoute route)
        {
            route.CreatedAt = DateTime.Now;
            _context.TransportRoutes.Add(route);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTransportRoute), new { id = route.Id }, route);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTransportRoute(int id, TransportRoute route)
        {
            if (id != route.Id) return BadRequest();
            var existing = await _context.TransportRoutes.FindAsync(id);
            if (existing == null) return NotFound();

            route.UpdatedAt = DateTime.Now;
            route.CreatedAt = existing.CreatedAt;

            _context.Entry(existing).CurrentValues.SetValues(route);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransportRoute(int id)
        {
            var route = await _context.TransportRoutes.FindAsync(id);
            if (route == null) return NotFound();
            _context.TransportRoutes.Remove(route);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}