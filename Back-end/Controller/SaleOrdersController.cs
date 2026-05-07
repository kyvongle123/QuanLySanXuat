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
    public class SaleOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SaleOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/SaleOrders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SaleOrder>>> GetSaleOrders()
        {
            return await _context.SaleOrders.ToListAsync();
        }

        // GET: api/SaleOrders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SaleOrder>> GetSaleOrder(int id)
        {
            var saleOrder = await _context.SaleOrders.FindAsync(id);
            if (saleOrder == null)
            {
                return NotFound();
            }
            return saleOrder;
        }

        // POST: api/SaleOrders
        [HttpPost]
        public async Task<ActionResult<SaleOrder>> PostSaleOrder(SaleOrder saleOrder)
        {
            saleOrder.CreatedAt = DateTime.Now;
            saleOrder.UpdatedAt = DateTime.Now;
            _context.SaleOrders.Add(saleOrder);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSaleOrder), new { id = saleOrder.ID }, saleOrder);
        }

        // PUT: api/SaleOrders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSaleOrder(int id, SaleOrder saleOrder)
        {
            if (id != saleOrder.ID)
            {
                return BadRequest("ID không khớp.");
            }

            var existing = await _context.SaleOrders.AsNoTracking().FirstOrDefaultAsync(s => s.ID == id);
            if (existing == null) return NotFound();

            saleOrder.UpdatedAt = DateTime.Now;
            saleOrder.CreatedAt = existing.CreatedAt; // Giữ nguyên ngày tạo gốc

            _context.Entry(saleOrder).State = EntityState.Modified;
            _context.Entry(saleOrder).Property(x => x.CreatedAt).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SaleOrderExists(id)) return NotFound();
                else throw;
            }
            return Ok(saleOrder);
        }

        // DELETE: api/SaleOrders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSaleOrder(int id)
        {
            var saleOrder = await _context.SaleOrders.FindAsync(id);
            if (saleOrder == null) return NotFound();
            _context.SaleOrders.Remove(saleOrder);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool SaleOrderExists(int id)
        {
            return _context.SaleOrders.Any(e => e.ID == id);
        }
    }
}