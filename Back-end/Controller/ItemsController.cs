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
    public class ItemsController : ControllerBase
    {
        private const string ItemCodePrefix = "SP00";
        private const int MaxCreateItemCodeAttempts = 10;
        private readonly AppDbContext _context;

        public ItemsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Item>>> GetItems()
        {
            return await _context.Items.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Item>> GetItem(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult<Item>> PostItem(Item item)
        {
            var hasProvidedItemCode = !string.IsNullOrWhiteSpace(item.ItemCode);

            for (var attempt = 0; attempt < MaxCreateItemCodeAttempts; attempt++)
            {
                item.CreatedAt = DateTime.Now;

                if (!hasProvidedItemCode)
                {
                    item.ItemCode = await GenerateNextItemCodeAsync();
                }
                else
                {
                    item.ItemCode = item.ItemCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Items.Add(item);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
                }
                catch (DbUpdateException ex) when (IsUniqueItemCodeException(ex) && attempt < MaxCreateItemCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(item).State = EntityState.Detached;
                    item.Id = 0;

                    if (hasProvidedItemCode)
                    {
                        return Conflict("ItemCode đã tồn tại.");
                    }

                    item.ItemCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh ItemCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutItem(int id, Item item)
        {
            if (id != item.Id) return BadRequest();

            var existingItem = await _context.Items.FindAsync(id);
            if (existingItem == null) return NotFound();

            item.UpdatedAt = DateTime.Now;
            item.CreatedAt = existingItem.CreatedAt; // Giữ nguyên ngày tạo
            item.ItemCode = existingItem.ItemCode ?? await GenerateNextItemCodeAsync();

            _context.Entry(existingItem).CurrentValues.SetValues(item);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Items.AnyAsync(e => e.Id == id)) return NotFound();
                throw;
            }

            return Ok(existingItem);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();

            _context.Items.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateNextItemCodeAsync()
        {
            var itemCodes = await _context.Items
                .AsNoTracking()
                .Where(e => e.ItemCode != null && e.ItemCode.StartsWith(ItemCodePrefix))
                .Select(e => e.ItemCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var itemCode in itemCodes)
            {
                var numberText = itemCode[ItemCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{ItemCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueItemCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Items_ItemCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
