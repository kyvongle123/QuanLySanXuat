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
    public class ProductionSectionsController : ControllerBase
    {
        private const string ProductionSectionCodePrefix = "ST00";
        private const int MaxCreateProductionSectionCodeAttempts = 10;
        private readonly AppDbContext _context;

        public ProductionSectionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ProductionSections
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionSection>>> GetProductionSections()
        {
            return await _context.ProductionSections.ToListAsync();
        }

        // GET: api/ProductionSections/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionSection>> GetProductionSection(int id)
        {
            var productionSection = await _context.ProductionSections.FindAsync(id);
            if (productionSection == null)
            {
                return NotFound();
            }
            return productionSection;
        }

        // POST: api/ProductionSections
        [HttpPost]
        public async Task<ActionResult<ProductionSection>> PostProductionSection(ProductionSection productionSection)
        {
            var hasProvidedProductionSectionCode = !string.IsNullOrWhiteSpace(productionSection.ProductionSectionCode);

            for (var attempt = 0; attempt < MaxCreateProductionSectionCodeAttempts; attempt++)
            {
                if (!hasProvidedProductionSectionCode)
                {
                    productionSection.ProductionSectionCode = await GenerateNextProductionSectionCodeAsync();
                }
                else
                {
                    productionSection.ProductionSectionCode = productionSection.ProductionSectionCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.ProductionSections.Add(productionSection);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetProductionSection), new { id = productionSection.ID }, productionSection);
                }
                catch (DbUpdateException ex) when (IsUniqueProductionSectionCodeException(ex) && attempt < MaxCreateProductionSectionCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(productionSection).State = EntityState.Detached;
                    productionSection.ID = 0;

                    if (hasProvidedProductionSectionCode)
                    {
                        return Conflict("ProductionSectionCode đã tồn tại.");
                    }

                    productionSection.ProductionSectionCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh ProductionSectionCode không trùng sau nhiều lần thử.");
        }

        // PUT: api/ProductionSections/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionSection(int id, ProductionSection productionSection)
        {
            if (id != productionSection.ID)
            {
                return BadRequest("ID không khớp.");
            }

            var existingProductionSection = await _context.ProductionSections.FindAsync(id);
            if (existingProductionSection == null) return NotFound();

            productionSection.ProductionSectionCode = existingProductionSection.ProductionSectionCode ?? await GenerateNextProductionSectionCodeAsync();

            _context.Entry(existingProductionSection).CurrentValues.SetValues(productionSection);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductionSectionExists(id)) return NotFound();
                else throw;
            }
            return Ok(existingProductionSection);
        }

        // DELETE: api/ProductionSections/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductionSection(int id)
        {
            var productionSection = await _context.ProductionSections.FindAsync(id);
            if (productionSection == null) return NotFound();
            _context.ProductionSections.Remove(productionSection);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool ProductionSectionExists(int id)
        {
            return _context.ProductionSections.Any(e => e.ID == id);
        }

        private async Task<string> GenerateNextProductionSectionCodeAsync()
        {
            var productionSectionCodes = await _context.ProductionSections
                .AsNoTracking()
                .Where(e => e.ProductionSectionCode != null && e.ProductionSectionCode.StartsWith(ProductionSectionCodePrefix))
                .Select(e => e.ProductionSectionCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var productionSectionCode in productionSectionCodes)
            {
                var numberText = productionSectionCode[ProductionSectionCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{ProductionSectionCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueProductionSectionCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_ProductionSections_ProductionSectionCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
