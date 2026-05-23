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
    public class RolesController : ControllerBase
    {
        private const string RoleCodePrefix = "CV00";
        private const int MaxCreateRoleCodeAttempts = 10;
        private readonly AppDbContext _context;
        public RolesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Role>>> GetRoles() => await _context.Roles.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<Role>> GetRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            return role == null ? NotFound() : role;
        }

        [HttpPost]
        public async Task<ActionResult<Role>> PostRole(Role role)
        {
            var hasProvidedRoleCode = !string.IsNullOrWhiteSpace(role.RoleCode);

            for (var attempt = 0; attempt < MaxCreateRoleCodeAttempts; attempt++)
            {
                if (!hasProvidedRoleCode)
                {
                    role.RoleCode = await GenerateNextRoleCodeAsync();
                }
                else
                {
                    role.RoleCode = role.RoleCode!.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();
                _context.Roles.Add(role);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetRole), new { id = role.Id }, role);
                }
                catch (DbUpdateException ex) when (IsUniqueRoleCodeException(ex))
                {
                    await transaction.RollbackAsync();
                    _context.Entry(role).State = EntityState.Detached;
                    role.Id = 0;

                    if (hasProvidedRoleCode || attempt >= MaxCreateRoleCodeAttempts - 1)
                    {
                        return Conflict("RoleCode đã tồn tại.");
                    }

                    role.RoleCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh RoleCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutRole(int id, Role role)
        {
            if (id != role.Id) return BadRequest();
            var existing = await _context.Roles.FindAsync(id);
            if (existing == null) return NotFound();

            role.RoleCode = string.IsNullOrWhiteSpace(existing.RoleCode)
                ? await GenerateNextRoleCodeAsync()
                : existing.RoleCode;

            _context.Entry(existing).CurrentValues.SetValues(role);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound();
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateNextRoleCodeAsync()
        {
            var roleCodes = await _context.Roles
                .AsNoTracking()
                .Where(e => e.RoleCode != null && e.RoleCode.StartsWith(RoleCodePrefix))
                .Select(e => e.RoleCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var roleCode in roleCodes)
            {
                var numberText = roleCode[RoleCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{RoleCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueRoleCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Roles_RoleCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
