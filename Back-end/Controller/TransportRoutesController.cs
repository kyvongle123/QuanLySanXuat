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
    public class TransportRoutesController : ControllerBase
    {
        private const string RouteCodePrefix = "LT00";
        private const int MaxCreateRouteCodeAttempts = 10;
        private readonly AppDbContext _context;
        public TransportRoutesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TransportRoute>>> GetTransportRoutes() => await _context.TransportRoutes.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<TransportRoute>> GetTransportRoute(int id)
        {
            var route = await _context.TransportRoutes.FindAsync(id);
            return route == null ? NotFound() : route;
        }

        [HttpPost]
        public async Task<ActionResult<TransportRoute>> PostTransportRoute(TransportRoute route)
        {
            var hasProvidedRouteCode = !string.IsNullOrWhiteSpace(route.RouteCode);

            for (var attempt = 0; attempt < MaxCreateRouteCodeAttempts; attempt++)
            {
                if (!hasProvidedRouteCode)
                {
                    route.RouteCode = await GenerateNextRouteCodeAsync();
                }
                else
                {
                    route.RouteCode = route.RouteCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                route.CreatedAt = DateTime.Now;
                _context.TransportRoutes.Add(route);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetTransportRoute), new { id = route.Id }, route);
                }
                catch (DbUpdateException ex) when (IsUniqueRouteCodeException(ex))
                {
                    await transaction.RollbackAsync();
                    _context.Entry(route).State = EntityState.Detached;
                    route.Id = 0;

                    if (hasProvidedRouteCode || attempt >= MaxCreateRouteCodeAttempts - 1)
                    {
                        return Conflict("RouteCode đã tồn tại.");
                    }

                    route.RouteCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh RouteCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTransportRoute(int id, TransportRoute route)
        {
            if (id != route.Id) return BadRequest();
            var existing = await _context.TransportRoutes.FindAsync(id);
            if (existing == null) return NotFound();

            route.UpdatedAt = DateTime.Now;
            route.CreatedAt = existing.CreatedAt;
            route.RouteCode = string.IsNullOrWhiteSpace(existing.RouteCode)
                ? await GenerateNextRouteCodeAsync()
                : existing.RouteCode;

            _context.Entry(existing).CurrentValues.SetValues(route);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransportRoute(int id)
        {
            var route = await _context.TransportRoutes.FindAsync(id);
            if (route == null) return NotFound();
            _context.TransportRoutes.Remove(route);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateNextRouteCodeAsync()
        {
            var routeCodes = await _context.TransportRoutes
                .AsNoTracking()
                .Where(e => e.RouteCode != null && e.RouteCode.StartsWith(RouteCodePrefix))
                .Select(e => e.RouteCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var routeCode in routeCodes)
            {
                var numberText = routeCode[RouteCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{RouteCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueRouteCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_TransportRoutes_RouteCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
