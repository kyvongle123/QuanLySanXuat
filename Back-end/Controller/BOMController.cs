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
    public class BOMController : ControllerBase
    {
        private const string BomCodePrefix = "ĐM00";
        private const int MaxCreateBomCodeAttempts = 10;
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
            var hasProvidedBomCode = !string.IsNullOrWhiteSpace(bom.BomCode);

            for (var attempt = 0; attempt < MaxCreateBomCodeAttempts; attempt++)
            {
                bom.CreatedAt = DateTime.Now;

                if (!hasProvidedBomCode)
                {
                    bom.BomCode = await GenerateNextBomCodeAsync();
                }
                else
                {
                    bom.BomCode = bom.BomCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Boms.Add(bom);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetBOM), new { id = bom.Id }, bom);
                }
                catch (DbUpdateException ex) when (IsUniqueBomCodeException(ex) && attempt < MaxCreateBomCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(bom).State = EntityState.Detached;
                    bom.Id = 0;

                    if (hasProvidedBomCode)
                    {
                        return Conflict("BomCode đã tồn tại.");
                    }

                    bom.BomCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh BomCode không trùng sau nhiều lần thử.");
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
            bom.BomCode = existingBOM.BomCode ?? await GenerateNextBomCodeAsync();

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

        private async Task<string> GenerateNextBomCodeAsync()
        {
            var bomCodes = await _context.Boms
                .AsNoTracking()
                .Where(e => e.BomCode != null && e.BomCode.StartsWith(BomCodePrefix))
                .Select(e => e.BomCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var bomCode in bomCodes)
            {
                var numberText = bomCode[BomCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{BomCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueBomCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_BOM_BomCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("IX_Boms_BomCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
