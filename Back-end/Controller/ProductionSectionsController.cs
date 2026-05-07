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
    public class ProductionSectionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductionSectionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ProductionSections
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionSection>>> GetProductionSections()
        {
            return await _context.ProductionSections.ToListAsync();
        }

        // GET: api/ProductionSections/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionSection>> GetProductionSection(int id)
        {
            var productionSection = await _context.ProductionSections.FindAsync(id);
            if (productionSection == null)
            {
                return NotFound();
            }
            return productionSection;
        }

        // POST: api/ProductionSections
        [HttpPost]
        public async Task<ActionResult<ProductionSection>> PostProductionSection(ProductionSection productionSection)
        {
            _context.ProductionSections.Add(productionSection);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProductionSection), new { id = productionSection.ID }, productionSection);
        }

        // PUT: api/ProductionSections/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionSection(int id, ProductionSection productionSection)
        {
            if (id != productionSection.ID)
            {
                return BadRequest("ID không khớp.");
            }

            _context.Entry(productionSection).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductionSectionExists(id)) return NotFound();
                else throw;
            }
            return Ok(productionSection);
        }

        // DELETE: api/ProductionSections/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductionSection(int id)
        {
            var productionSection = await _context.ProductionSections.FindAsync(id);
            if (productionSection == null) return NotFound();
            _context.ProductionSections.Remove(productionSection);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool ProductionSectionExists(int id)
        {
            return _context.ProductionSections.Any(e => e.ID == id);
        }
    }
}