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
        private const string OrderCodePrefix = "LSX00";
        private const int MaxCreateOrderCodeAttempts = 10;
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
            var hasProvidedOrderCode = !string.IsNullOrWhiteSpace(order.OrderCode);

            for (var attempt = 0; attempt < MaxCreateOrderCodeAttempts; attempt++)
            {
                if (!hasProvidedOrderCode)
                {
                    order.OrderCode = await GenerateNextOrderCodeAsync();
                }
                else
                {
                    order.OrderCode = order.OrderCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                order.CreatedAt = DateTime.Now;
                order.UpdatedAt = DateTime.Now;
                _context.ProductionOrders.Add(order);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetProductionOrder), new { id = order.Id }, order);
                }
                catch (DbUpdateException ex) when (IsUniqueOrderCodeException(ex))
                {
                    await transaction.RollbackAsync();
                    _context.Entry(order).State = EntityState.Detached;
                    order.Id = 0;

                    if (hasProvidedOrderCode || attempt >= MaxCreateOrderCodeAttempts - 1)
                    {
                        return Conflict("OrderCode đã tồn tại.");
                    }

                    order.OrderCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh OrderCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionOrder(int id, ProductionOrder order)
        {
            if (id != order.Id) return BadRequest();

            var existing = await _context.ProductionOrders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (existing == null) return NotFound();

            order.UpdatedAt = DateTime.Now;
            order.CreatedAt = existing.CreatedAt;
            order.OrderCode = string.IsNullOrWhiteSpace(existing.OrderCode)
                ? await GenerateNextOrderCodeAsync()
                : existing.OrderCode;

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

        private async Task<string> GenerateNextOrderCodeAsync()
        {
            var orderCodes = await _context.ProductionOrders
                .AsNoTracking()
                .Where(e => e.OrderCode != null && e.OrderCode.StartsWith(OrderCodePrefix))
                .Select(e => e.OrderCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var orderCode in orderCodes)
            {
                var numberText = orderCode[OrderCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{OrderCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueOrderCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_ProductionOrders_OrderCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
