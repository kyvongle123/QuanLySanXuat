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
    public class ProductionOrderStatusesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductionOrderStatusesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionOrderStatus>>> GetProductionOrderStatuses()
        {
            return await _context.ProductionOrderStatuses.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionOrderStatus>> GetProductionOrderStatus(int id)
        {
            var status = await _context.ProductionOrderStatuses.FindAsync(id);
            if (status == null) return NotFound();
            return status;
        }

        [HttpPost]
        public async Task<ActionResult<ProductionOrderStatus>> PostProductionOrderStatus(ProductionOrderStatus status)
        {
            _context.ProductionOrderStatuses.Add(status);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProductionOrderStatus), new { id = status.Id }, status);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionOrderStatus(int id, ProductionOrderStatus status)
        {
            if (id != status.Id) return BadRequest();

            _context.Entry(status).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.ProductionOrderStatuses.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return Ok(status);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductionOrderStatus(int id)
        {
            var status = await _context.ProductionOrderStatuses.FindAsync(id);
            if (status == null) return NotFound();

            _context.ProductionOrderStatuses.Remove(status);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}