using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class MachinesController : ControllerBase
    {
        private const string MachineCodePrefix = "TB00";
        private const int MaxCreateMachineCodeAttempts = 10;
        private readonly AppDbContext _context;

        public MachinesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Machine>>> GetMachines()
        {
            return await _context.Machines.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Machine>> GetMachine(int id)
        {
            var machine = await _context.Machines.FindAsync(id);
            if (machine == null) return NotFound();
            return machine;
        }

        [HttpPost]
        public async Task<ActionResult<Machine>> PostMachine(Machine machine)
        {
            var hasProvidedMachineCode = !string.IsNullOrWhiteSpace(machine.MachineCode);

            for (var attempt = 0; attempt < MaxCreateMachineCodeAttempts; attempt++)
            {
                machine.CreatedAt = DateTime.Now;
                machine.UpdatedAt = DateTime.Now;

                if (!hasProvidedMachineCode)
                {
                    machine.MachineCode = await GenerateNextMachineCodeAsync();
                }
                else
                {
                    machine.MachineCode = machine.MachineCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Machines.Add(machine);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetMachine), new { id = machine.Id }, machine);
                }
                catch (DbUpdateException ex) when (IsUniqueMachineCodeException(ex) && attempt < MaxCreateMachineCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(machine).State = EntityState.Detached;
                    machine.Id = 0;

                    if (hasProvidedMachineCode)
                    {
                        return Conflict("MachineCode đã tồn tại.");
                    }

                    machine.MachineCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh MachineCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMachine(int id, Machine machine)
        {
            if (id != machine.Id) return BadRequest();

            var existing = await _context.Machines.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
            if (existing == null) return NotFound();

            machine.UpdatedAt = DateTime.Now;
            machine.CreatedAt = existing.CreatedAt;
            machine.MachineCode = existing.MachineCode ?? await GenerateNextMachineCodeAsync();

            _context.Entry(machine).State = EntityState.Modified;
            _context.Entry(machine).Property(x => x.CreatedAt).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Machines.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return Ok(machine);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMachine(int id)
        {
            var machine = await _context.Machines.FindAsync(id);
            if (machine == null) return NotFound();

            _context.Machines.Remove(machine);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<string> GenerateNextMachineCodeAsync()
        {
            var machineCodes = await _context.Machines
                .AsNoTracking()
                .Where(e => e.MachineCode != null && e.MachineCode.StartsWith(MachineCodePrefix))
                .Select(e => e.MachineCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var machineCode in machineCodes)
            {
                var numberText = machineCode[MachineCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{MachineCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueMachineCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Machines_MachineCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
