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
    public class SaleOrderItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SaleOrderItemsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/SaleOrderItems
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SaleOrderItem>>> GetSaleOrderItems()
        {
            return await _context.SaleOrderItems.ToListAsync();
        }

        // GET: api/SaleOrderItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SaleOrderItem>> GetSaleOrderItem(int id)
        {
            var saleOrderItem = await _context.SaleOrderItems.FindAsync(id);
            if (saleOrderItem == null)
            {
                return NotFound();
            }
            return saleOrderItem;
        }

        // POST: api/SaleOrderItems
        [HttpPost]
        public async Task<ActionResult<SaleOrderItem>> PostSaleOrderItem(SaleOrderItem saleOrderItem)
        {
            _context.SaleOrderItems.Add(saleOrderItem);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSaleOrderItem), new { id = saleOrderItem.ID }, saleOrderItem);
        }

        // PUT: api/SaleOrderItems/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSaleOrderItem(int id, SaleOrderItem saleOrderItem)
        {
            if (id != saleOrderItem.ID)
            {
                return BadRequest("ID không khớp.");
            }

            _context.Entry(saleOrderItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SaleOrderItemExists(id))
                {
                    return NotFound();
                }
                else throw;
            }
            return NoContent();
        }

        // DELETE: api/SaleOrderItems/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSaleOrderItem(int id)
        {
            var saleOrderItem = await _context.SaleOrderItems.FindAsync(id);
            if (saleOrderItem == null) return NotFound();
            _context.SaleOrderItems.Remove(saleOrderItem);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool SaleOrderItemExists(int id)
        {
            return _context.SaleOrderItems.Any(e => e.ID == id);
        }
    }
}