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
    public class DriversController : ControllerBase
    {
        private const string DriverCodePrefix = "TX00";
        private const int MaxCreateDriverCodeAttempts = 10;
        private readonly AppDbContext _context;
        public DriversController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Driver>>> GetDrivers() => await _context.Drivers.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<Driver>> GetDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);
            return driver == null ? NotFound() : driver;
        }

        [HttpPost]
        public async Task<ActionResult<Driver>> PostDriver(Driver driver)
        {
            var hasProvidedDriverCode = !string.IsNullOrWhiteSpace(driver.DriverCode);

            for (var attempt = 0; attempt < MaxCreateDriverCodeAttempts; attempt++)
            {
                if (!hasProvidedDriverCode)
                {
                    driver.DriverCode = await GenerateNextDriverCodeAsync();
                }
                else
                {
                    driver.DriverCode = driver.DriverCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();
                _context.Drivers.Add(driver);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetDriver), new { id = driver.Id }, driver);
                }
                catch (DbUpdateException ex) when (IsUniqueDriverCodeException(ex))
                {
                    await transaction.RollbackAsync();
                    _context.Entry(driver).State = EntityState.Detached;
                    driver.Id = 0;

                    if (hasProvidedDriverCode || attempt >= MaxCreateDriverCodeAttempts - 1)
                    {
                        return Conflict("DriverCode đã tồn tại.");
                    }

                    driver.DriverCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh DriverCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutDriver(int id, Driver driver)
        {
            if (id != driver.Id) return BadRequest();
            var existing = await _context.Drivers.FindAsync(id);
            if (existing == null) return NotFound();

            driver.DriverCode = string.IsNullOrWhiteSpace(existing.DriverCode)
                ? await GenerateNextDriverCodeAsync()
                : existing.DriverCode;

            _context.Entry(existing).CurrentValues.SetValues(driver);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null) return NotFound();
            _context.Drivers.Remove(driver);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateNextDriverCodeAsync()
        {
            var driverCodes = await _context.Drivers
                .AsNoTracking()
                .Where(e => e.DriverCode != null && e.DriverCode.StartsWith(DriverCodePrefix))
                .Select(e => e.DriverCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var driverCode in driverCodes)
            {
                var numberText = driverCode[DriverCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{DriverCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueDriverCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Drivers_DriverCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
