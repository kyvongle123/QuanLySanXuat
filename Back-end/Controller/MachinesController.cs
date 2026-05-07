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
            machine.CreatedAt = DateTime.Now;
            machine.UpdatedAt = DateTime.Now;
            _context.Machines.Add(machine);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMachine), new { id = machine.Id }, machine);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMachine(int id, Machine machine)
        {
            if (id != machine.Id) return BadRequest();

            var existing = await _context.Machines.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
            if (existing == null) return NotFound();

            machine.UpdatedAt = DateTime.Now;
            machine.CreatedAt = existing.CreatedAt;

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
    }
}