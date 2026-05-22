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
    public class UnitsController : ControllerBase
    {
        private const string UnitCodePrefix = "DVT00";
        private const int MaxCreateUnitCodeAttempts = 10;
        private readonly AppDbContext _context;

        public UnitsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Units
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Unit>>> GetUnits()
        {
            return await _context.Units.ToListAsync();
        }

        // GET: api/Units/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Unit>> GetUnit(int id)
        {
            var unit = await _context.Units.FindAsync(id);
            if (unit == null) return NotFound();
            return unit;
        }

        // POST: api/Units
        [HttpPost]
        public async Task<ActionResult<Unit>> PostUnit(Unit unit)
        {
            var hasProvidedUnitCode = !string.IsNullOrWhiteSpace(unit.UnitCode);

            for (var attempt = 0; attempt < MaxCreateUnitCodeAttempts; attempt++)
            {
                if (!hasProvidedUnitCode)
                {
                    unit.UnitCode = await GenerateNextUnitCodeAsync();
                }
                else
                {
                    unit.UnitCode = unit.UnitCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Units.Add(unit);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetUnit), new { id = unit.ID }, unit);
                }
                catch (DbUpdateException ex) when (IsUniqueUnitCodeException(ex) && attempt < MaxCreateUnitCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(unit).State = EntityState.Detached;
                    unit.ID = 0;

                    if (hasProvidedUnitCode)
                    {
                        return Conflict("UnitCode đã tồn tại.");
                    }

                    unit.UnitCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh UnitCode không trùng sau nhiều lần thử.");
        }

        // PUT: api/Units/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUnit(int id, Unit unit)
        {
            if (id != unit.ID) return BadRequest("ID không khớp.");

            var existingUnit = await _context.Units.FindAsync(id);
            if (existingUnit == null) return NotFound();

            unit.UnitCode = existingUnit.UnitCode ?? await GenerateNextUnitCodeAsync();

            _context.Entry(existingUnit).CurrentValues.SetValues(unit);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UnitExists(id)) return NotFound();
                else throw;
            }

            return Ok(existingUnit);
        }

        // DELETE: api/Units/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            var unit = await _context.Units.FindAsync(id);
            if (unit == null) return NotFound();

            _context.Units.Remove(unit);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool UnitExists(int id)
        {
            return _context.Units.Any(e => e.ID == id);
        }

        private async Task<string> GenerateNextUnitCodeAsync()
        {
            var unitCodes = await _context.Units
                .AsNoTracking()
                .Where(e => e.UnitCode != null && e.UnitCode.StartsWith(UnitCodePrefix))
                .Select(e => e.UnitCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var unitCode in unitCodes)
            {
                var numberText = unitCode[UnitCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{UnitCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueUnitCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Units_UnitCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("IX_Unit_UnitCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
