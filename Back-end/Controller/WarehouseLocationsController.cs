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
    public class WarehouseLocationsController : ControllerBase
    {
        private const string LocationCodePrefix = "VT00";
        private const int MaxCreateLocationCodeAttempts = 10;
        private readonly AppDbContext _context;

        public WarehouseLocationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/WarehouseLocations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseLocation>>> GetWarehouseLocations()
        {
            return await _context.WarehouseLocations.ToListAsync();
        }

        // GET: api/WarehouseLocations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseLocation>> GetWarehouseLocation(int id)
        {
            var location = await _context.WarehouseLocations.FindAsync(id);
            if (location == null) return NotFound();
            return location;
        }

        // POST: api/WarehouseLocations
        [HttpPost]
        public async Task<ActionResult<WarehouseLocation>> PostWarehouseLocation(WarehouseLocation location)
        {
            var hasProvidedLocationCode = !string.IsNullOrWhiteSpace(location.LocationCode);

            for (var attempt = 0; attempt < MaxCreateLocationCodeAttempts; attempt++)
            {
                if (!hasProvidedLocationCode)
                {
                    location.LocationCode = await GenerateNextLocationCodeAsync();
                }
                else
                {
                    location.LocationCode = location.LocationCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.WarehouseLocations.Add(location);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetWarehouseLocation), new { id = location.ID }, location);
                }
                catch (DbUpdateException ex) when (IsUniqueLocationCodeException(ex) && attempt < MaxCreateLocationCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(location).State = EntityState.Detached;
                    location.ID = 0;

                    if (hasProvidedLocationCode)
                    {
                        return Conflict("LocationCode đã tồn tại.");
                    }

                    location.LocationCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh LocationCode không trùng sau nhiều lần thử.");
        }

        // PUT: api/WarehouseLocations/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWarehouseLocation(int id, WarehouseLocation location)
        {
            if (id != location.ID) return BadRequest("ID không khớp.");

            var existingLocation = await _context.WarehouseLocations.FindAsync(id);
            if (existingLocation == null) return NotFound();

            location.LocationCode = existingLocation.LocationCode ?? await GenerateNextLocationCodeAsync();

            _context.Entry(existingLocation).CurrentValues.SetValues(location);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarehouseLocationExists(id)) return NotFound();
                else throw;
            }

            return Ok(existingLocation);
        }

        // DELETE: api/WarehouseLocations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouseLocation(int id)
        {
            var location = await _context.WarehouseLocations.FindAsync(id);
            if (location == null) return NotFound();

            _context.WarehouseLocations.Remove(location);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WarehouseLocationExists(int id)
        {
            return _context.WarehouseLocations.Any(e => e.ID == id);
        }

        private async Task<string> GenerateNextLocationCodeAsync()
        {
            var locationCodes = await _context.WarehouseLocations
                .AsNoTracking()
                .Where(e => e.LocationCode != null && e.LocationCode.StartsWith(LocationCodePrefix))
                .Select(e => e.LocationCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var locationCode in locationCodes)
            {
                var numberText = locationCode[LocationCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{LocationCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueLocationCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_WarehouseLocations_LocationCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("IX_Warehouse_locations_LocationCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
