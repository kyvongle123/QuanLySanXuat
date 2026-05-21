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
    public class WarehousesController : ControllerBase
    {
        private const string WarehouseCodePrefix = "NK00";
        private const int MaxCreateWarehouseCodeAttempts = 10;
        private readonly AppDbContext _context;

        public WarehousesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Warehouses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Warehouse>>> GetWarehouses()
        {
            return await _context.Warehouses.ToListAsync();
        }

        // GET: api/Warehouses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Warehouse>> GetWarehouse(int id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return NotFound();
            return warehouse;
        }

        // POST: api/Warehouses
        [HttpPost]
        public async Task<ActionResult<Warehouse>> PostWarehouse(Warehouse warehouse)
        {
            var hasProvidedWarehouseCode = !string.IsNullOrWhiteSpace(warehouse.WarehouseCode);

            for (var attempt = 0; attempt < MaxCreateWarehouseCodeAttempts; attempt++)
            {
                if (!hasProvidedWarehouseCode)
                {
                    warehouse.WarehouseCode = await GenerateNextWarehouseCodeAsync();
                }
                else
                {
                    warehouse.WarehouseCode = warehouse.WarehouseCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Warehouses.Add(warehouse);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.ID }, warehouse);
                }
                catch (DbUpdateException ex) when (IsUniqueWarehouseCodeException(ex) && attempt < MaxCreateWarehouseCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(warehouse).State = EntityState.Detached;
                    warehouse.ID = 0;

                    if (hasProvidedWarehouseCode)
                    {
                        return Conflict("WarehouseCode đã tồn tại.");
                    }

                    warehouse.WarehouseCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh WarehouseCode không trùng sau nhiều lần thử.");
        }

        // PUT: api/Warehouses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouse(int id, Warehouse warehouse)
        {
            if (id != warehouse.ID) return BadRequest("ID không khớp.");

            var existingWarehouse = await _context.Warehouses.FindAsync(id);
            if (existingWarehouse == null) return NotFound();

            warehouse.WarehouseCode = existingWarehouse.WarehouseCode ?? await GenerateNextWarehouseCodeAsync();

            _context.Entry(existingWarehouse).CurrentValues.SetValues(warehouse);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseExists(id)) return NotFound();
                throw;
            }

            return Ok(existingWarehouse);
        }

        // DELETE: api/Warehouses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouse(int id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return NotFound();

            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WarehouseExists(int id)
        {
            return _context.Warehouses.Any(e => e.ID == id);
        }

        private async Task<string> GenerateNextWarehouseCodeAsync()
        {
            var warehouseCodes = await _context.Warehouses
                .AsNoTracking()
                .Where(e => e.WarehouseCode != null && e.WarehouseCode.StartsWith(WarehouseCodePrefix))
                .Select(e => e.WarehouseCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var warehouseCode in warehouseCodes)
            {
                var numberText = warehouseCode[WarehouseCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{WarehouseCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueWarehouseCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Warehouses_WarehouseCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
