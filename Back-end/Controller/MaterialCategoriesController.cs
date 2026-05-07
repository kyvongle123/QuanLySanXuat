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
    public class MaterialCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public MaterialCategoriesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaterialCategory>>> GetMaterialCategories() => await _context.MaterialCategories.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialCategory>> GetMaterialCategory(int id)
        {
            var category = await _context.MaterialCategories.FindAsync(id);
            return category == null ? NotFound() : category;
        }

        [HttpPost]
        public async Task<ActionResult<MaterialCategory>> PostMaterialCategory(MaterialCategory materialCategory)
        {
            _context.MaterialCategories.Add(materialCategory);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMaterialCategory), new { id = materialCategory.Id }, materialCategory);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaterialCategory(int id, MaterialCategory materialCategory)
        {
            if (id != materialCategory.Id) return BadRequest();
            var existing = await _context.MaterialCategories.FindAsync(id);
            if (existing == null) return NotFound();

            _context.Entry(existing).CurrentValues.SetValues(materialCategory);
            
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.MaterialCategories.AnyAsync(e => e.Id == id)) return NotFound();
                throw;
            }

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterialCategory(int id)
        {
            var category = await _context.MaterialCategories.FindAsync(id);
            if (category == null) return NotFound();
            _context.MaterialCategories.Remove(category);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}