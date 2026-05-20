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
    public class MaterialReceiptStatusesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaterialReceiptStatusesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaterialReceiptStatus>>> GetMaterialReceiptStatuses()
        {
            return await _context.MaterialReceiptStatuses.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialReceiptStatus>> GetMaterialReceiptStatus(int id)
        {
            var status = await _context.MaterialReceiptStatuses.FindAsync(id);
            if (status == null) return NotFound();

            return status;
        }

        [HttpPost]
        public async Task<ActionResult<MaterialReceiptStatus>> PostMaterialReceiptStatus(MaterialReceiptStatus status)
        {
            _context.MaterialReceiptStatuses.Add(status);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaterialReceiptStatus), new { id = status.Id }, status);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaterialReceiptStatus(int id, MaterialReceiptStatus status)
        {
            if (id != status.Id) return BadRequest();

            _context.Entry(status).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MaterialReceiptStatusExists(id)) return NotFound();
                throw;
            }

            return Ok(status);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterialReceiptStatus(int id)
        {
            var status = await _context.MaterialReceiptStatuses.FindAsync(id);
            if (status == null) return NotFound();

            _context.MaterialReceiptStatuses.Remove(status);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MaterialReceiptStatusExists(int id)
        {
            return _context.MaterialReceiptStatuses.Any(e => e.Id == id);
        }
    }
}
