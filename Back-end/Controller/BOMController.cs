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
    public class BOMController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BOMController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/BOM
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Bom>>> GetBOMs()
        {
            return await _context.Boms.ToListAsync();
        }

        // GET: api/BOM/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Bom>> GetBOM(int id)
        {
            var bom = await _context.Boms.FindAsync(id);
            if (bom == null) return NotFound();
            return bom;
        }

        // POST: api/BOM
        [HttpPost]
        public async Task<ActionResult<Bom>> PostBOM(Bom bom)
        {
            bom.CreatedAt = DateTime.Now;
            _context.Boms.Add(bom);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBOM), new { id = bom.Id }, bom);
        }

        // PUT: api/BOM/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBOM(int id, Bom bom)
        {
            if (id != bom.Id) return BadRequest();

            var existingBOM = await _context.Boms.FindAsync(id);
            if (existingBOM == null) return NotFound();
            
            bom.UpdatedAt = DateTime.Now;
            // Giữ lại ngày tạo gốc
            bom.CreatedAt = existingBOM.CreatedAt;

            _context.Entry(existingBOM).CurrentValues.SetValues(bom);
            
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Boms.AnyAsync(e => e.Id == id)) return NotFound();
                throw;
            }

            return Ok(existingBOM);
        }

        // DELETE: api/BOM/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBOM(int id)
        {
            var bom = await _context.Boms.FindAsync(id);
            if (bom == null) return NotFound();

            _context.Boms.Remove(bom);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}