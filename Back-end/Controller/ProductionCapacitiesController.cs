using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductionCapacitiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductionCapacitiesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionCapacity>>> GetProductionCapacities()
        {
            return await _context.ProductionCapacities.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionCapacity>> GetProductionCapacity(int id)
        {
            var capacity = await _context.ProductionCapacities.FindAsync(id);
            if (capacity == null) return NotFound();
            return capacity;
        }

        [HttpPost]
        public async Task<ActionResult<ProductionCapacity>> PostProductionCapacity(ProductionCapacity capacity)
        {
            capacity.CreatedAt = DateTime.Now;
            capacity.UpdatedAt = DateTime.Now;
            _context.ProductionCapacities.Add(capacity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductionCapacity), new { id = capacity.Id }, capacity);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionCapacity(int id, ProductionCapacity capacity)
        {
            if (id != capacity.Id) return BadRequest();

            var existing = await _context.ProductionCapacities.FindAsync(id);
            if (existing == null) return NotFound();

            capacity.UpdatedAt = DateTime.Now;
            capacity.CreatedAt = existing.CreatedAt; // Giữ lại ngày tạo gốc

            _context.Entry(existing).CurrentValues.SetValues(capacity);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.ProductionCapacities.AnyAsync(e => e.Id == id)) return NotFound();
                throw;
            }

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductionCapacity(int id)
        {
            var capacity = await _context.ProductionCapacities.FindAsync(id);
            if (capacity == null) return NotFound();

            _context.ProductionCapacities.Remove(capacity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}