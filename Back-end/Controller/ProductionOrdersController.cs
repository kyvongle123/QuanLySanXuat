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
    public class ProductionOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductionOrdersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionOrder>>> GetProductionOrders()
        {
            return await _context.ProductionOrders.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionOrder>> GetProductionOrder(int id)
        {
            var order = await _context.ProductionOrders.FindAsync(id);
            if (order == null) return NotFound();
            return order;
        }

        [HttpPost]
        public async Task<ActionResult<ProductionOrder>> PostProductionOrder(ProductionOrder order)
        {
            order.CreatedAt = DateTime.Now;
            order.UpdatedAt = DateTime.Now;
            _context.ProductionOrders.Add(order);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProductionOrder), new { id = order.Id }, order);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionOrder(int id, ProductionOrder order)
        {
            if (id != order.Id) return BadRequest();

            var existing = await _context.ProductionOrders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (existing == null) return NotFound();

            order.UpdatedAt = DateTime.Now;
            order.CreatedAt = existing.CreatedAt;

            _context.Entry(order).State = EntityState.Modified;
            _context.Entry(order).Property(x => x.CreatedAt).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.ProductionOrders.AnyAsync(e => e.Id == id)) return NotFound();
                else throw;
            }

            return Ok(order);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductionOrder(int id)
        {
            var order = await _context.ProductionOrders.FindAsync(id);
            if (order == null) return NotFound();

            _context.ProductionOrders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}