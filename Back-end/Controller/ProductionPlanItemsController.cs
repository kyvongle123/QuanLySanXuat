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
    public class ProductionPlanItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductionPlanItemsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionPlanItem>>> GetProductionPlanItems()
        {
            return await _context.ProductionPlanItems.ToListAsync();
        }

        [HttpGet("plan/{planId}")]
        public async Task<ActionResult<IEnumerable<ProductionPlanItem>>> GetByPlanId(int planId)
        {
            return await _context.ProductionPlanItems
                .Where(p => p.ProductionPlan == planId)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionPlanItem>> GetProductionPlanItem(int id)
        {
            var item = await _context.ProductionPlanItems.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult<ProductionPlanItem>> PostProductionPlanItem(ProductionPlanItem item)
        {
            _context.ProductionPlanItems.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProductionPlanItem), new { id = item.Id }, item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionPlanItem(int id, ProductionPlanItem item)
        {
            if (id != item.Id) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.ProductionPlanItems.Any(e => e.Id == id)) return NotFound();
                throw;
            }
            return Ok(item);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductionPlanItem(int id)
        {
            var item = await _context.ProductionPlanItems.FindAsync(id);
            if (item == null) return NotFound();
            _context.ProductionPlanItems.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}