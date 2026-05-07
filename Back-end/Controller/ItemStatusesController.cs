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
    public class ItemStatusesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ItemStatusesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemStatus>>> GetItemStatuses() => await _context.ItemStatuses.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<ItemStatus>> GetItemStatus(int id)
        {
            var status = await _context.ItemStatuses.FindAsync(id);
            return status == null ? NotFound() : status;
        }

        [HttpPost]
        public async Task<ActionResult<ItemStatus>> PostItemStatus(ItemStatus status)
        {
            _context.ItemStatuses.Add(status);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetItemStatus), new { id = status.Id }, status);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutItemStatus(int id, ItemStatus status)
        {
            if (id != status.Id) return BadRequest();
            var existing = await _context.ItemStatuses.FindAsync(id);
            if (existing == null) return NotFound();

            _context.Entry(existing).CurrentValues.SetValues(status);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItemStatus(int id)
        {
            var status = await _context.ItemStatuses.FindAsync(id);
            if (status == null) return NotFound();
            _context.ItemStatuses.Remove(status);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}