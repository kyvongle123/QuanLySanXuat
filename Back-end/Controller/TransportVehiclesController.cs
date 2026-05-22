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
    public class TransportVehiclesController : ControllerBase
    {
        private const string VehicleCodePrefix = "XH00";
        private const int MaxCreateVehicleCodeAttempts = 10;
        private readonly AppDbContext _context;
        public TransportVehiclesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TransportVehicle>>> GetTransportVehicles() => await _context.TransportVehicles.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<TransportVehicle>> GetTransportVehicle(int id)
        {
            var vehicle = await _context.TransportVehicles.FindAsync(id);
            return vehicle == null ? NotFound() : vehicle;
        }

        [HttpPost]
        public async Task<ActionResult<TransportVehicle>> PostTransportVehicle(TransportVehicle vehicle)
        {
            var hasProvidedVehicleCode = !string.IsNullOrWhiteSpace(vehicle.VehicleCode);

            for (var attempt = 0; attempt < MaxCreateVehicleCodeAttempts; attempt++)
            {
                if (!hasProvidedVehicleCode)
                {
                    vehicle.VehicleCode = await GenerateNextVehicleCodeAsync();
                }
                else
                {
                    vehicle.VehicleCode = vehicle.VehicleCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();
                _context.TransportVehicles.Add(vehicle);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetTransportVehicle), new { id = vehicle.Id }, vehicle);
                }
                catch (DbUpdateException ex) when (IsUniqueVehicleCodeException(ex))
                {
                    await transaction.RollbackAsync();
                    _context.Entry(vehicle).State = EntityState.Detached;
                    vehicle.Id = 0;

                    if (hasProvidedVehicleCode || attempt >= MaxCreateVehicleCodeAttempts - 1)
                    {
                        return Conflict("VehicleCode đã tồn tại.");
                    }

                    vehicle.VehicleCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh VehicleCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTransportVehicle(int id, TransportVehicle vehicle)
        {
            if (id != vehicle.Id) return BadRequest();
            var existing = await _context.TransportVehicles.FindAsync(id);
            if (existing == null) return NotFound();

            vehicle.VehicleCode = string.IsNullOrWhiteSpace(existing.VehicleCode)
                ? await GenerateNextVehicleCodeAsync()
                : existing.VehicleCode;

            _context.Entry(existing).CurrentValues.SetValues(vehicle);
            try {
                await _context.SaveChangesAsync();
            } catch (DbUpdateConcurrencyException) {
                throw;
            }
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransportVehicle(int id)
        {
            var vehicle = await _context.TransportVehicles.FindAsync(id);
            if (vehicle == null) return NotFound();
            _context.TransportVehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateNextVehicleCodeAsync()
        {
            var vehicleCodes = await _context.TransportVehicles
                .AsNoTracking()
                .Where(e => e.VehicleCode != null && e.VehicleCode.StartsWith(VehicleCodePrefix))
                .Select(e => e.VehicleCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var vehicleCode in vehicleCodes)
            {
                var numberText = vehicleCode[VehicleCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{VehicleCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueVehicleCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_TransportVehicles_VehicleCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
