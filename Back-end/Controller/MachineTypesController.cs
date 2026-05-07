using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class MachineTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MachineTypesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MachineType>>> GetMachineTypes()
        {
            return await _context.MachineTypes.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MachineType>> GetMachineType(int id)
        {
            var machineType = await _context.MachineTypes.FindAsync(id);
            if (machineType == null) return NotFound();
            return machineType;
        }

        [HttpPost]
        public async Task<ActionResult<MachineType>> PostMachineType(MachineType machineType)
        {
            _context.MachineTypes.Add(machineType);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMachineType), new { id = machineType.Id }, machineType);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMachineType(int id, MachineType machineType)
        {
            if (id != machineType.Id) return BadRequest();

            var existing = await _context.MachineTypes.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
            if (existing == null) return NotFound();

            _context.Entry(machineType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.MachineTypes.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return Ok(machineType);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMachineType(int id)
        {
            var machineType = await _context.MachineTypes.FindAsync(id);
            if (machineType == null) return NotFound();

            _context.MachineTypes.Remove(machineType);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}