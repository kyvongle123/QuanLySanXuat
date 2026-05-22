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
    public class SuppliersController : ControllerBase
    {
        private const string SupplierCodePrefix = "NCC00";
        private const int MaxCreateSupplierCodeAttempts = 10;
        private readonly AppDbContext _context;

        public SuppliersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Suppliers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Supplier>>> GetSuppliers()
        {
            return await _context.Suppliers.ToListAsync();
        }

        // GET: api/Suppliers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Supplier>> GetSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound();
            return supplier;
        }

        // POST: api/Suppliers
        [HttpPost]
        public async Task<ActionResult<Supplier>> PostSupplier(Supplier supplier)
        {
            var hasProvidedSupplierCode = !string.IsNullOrWhiteSpace(supplier.SupplierCode);

            for (var attempt = 0; attempt < MaxCreateSupplierCodeAttempts; attempt++)
            {
                if (!hasProvidedSupplierCode)
                {
                    supplier.SupplierCode = await GenerateNextSupplierCodeAsync();
                }
                else
                {
                    supplier.SupplierCode = supplier.SupplierCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                supplier.CreatedAt = DateTime.Now;
                supplier.UpdatedAt = DateTime.Now;
                _context.Suppliers.Add(supplier);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetSupplier), new { id = supplier.ID }, supplier);
                }
                catch (DbUpdateException ex) when (IsUniqueSupplierCodeException(ex))
                {
                    await transaction.RollbackAsync();
                    _context.Entry(supplier).State = EntityState.Detached;
                    supplier.ID = 0;

                    if (hasProvidedSupplierCode || attempt >= MaxCreateSupplierCodeAttempts - 1)
                    {
                        return Conflict("SupplierCode đã tồn tại.");
                    }

                    supplier.SupplierCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh SupplierCode không trùng sau nhiều lần thử.");
        }

        // PUT: api/Suppliers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSupplier(int id, Supplier supplier)
        {
            if (id != supplier.ID) return BadRequest("ID không khớp.");

            var existing = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.ID == id);
            if (existing == null) return NotFound();

            supplier.UpdatedAt = DateTime.Now;
            supplier.CreatedAt = existing.CreatedAt; // Giữ nguyên ngày tạo gốc

            supplier.SupplierCode = string.IsNullOrWhiteSpace(existing.SupplierCode)
                ? await GenerateNextSupplierCodeAsync()
                : existing.SupplierCode;

            _context.Entry(supplier).State = EntityState.Modified;
            _context.Entry(supplier).Property(x => x.CreatedAt).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SupplierExists(id)) return NotFound();
                else throw;
            }

            return Ok(supplier);
        }

        // DELETE: api/Suppliers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound();

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool SupplierExists(int id)
        {
            return _context.Suppliers.Any(e => e.ID == id);
        }

        private async Task<string> GenerateNextSupplierCodeAsync()
        {
            var supplierCodes = await _context.Suppliers
                .AsNoTracking()
                .Where(e => e.SupplierCode != null && e.SupplierCode.StartsWith(SupplierCodePrefix))
                .Select(e => e.SupplierCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var supplierCode in supplierCodes)
            {
                var numberText = supplierCode[SupplierCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{SupplierCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueSupplierCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Suppliers_SupplierCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
