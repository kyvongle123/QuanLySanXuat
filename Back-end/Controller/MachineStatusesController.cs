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
    public class MachineStatusesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MachineStatusesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MachineStatus>>> GetMachineStatuses()
        {
            return await _context.MachineStatuses.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MachineStatus>> GetMachineStatus(int id)
        {
            var status = await _context.MachineStatuses.FindAsync(id);
            if (status == null) return NotFound();
            return status;
        }

        [HttpPost]
        public async Task<ActionResult<MachineStatus>> PostMachineStatus(MachineStatus machineStatus)
        {
            _context.MachineStatuses.Add(machineStatus);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMachineStatus), new { id = machineStatus.Id }, machineStatus);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMachineStatus(int id, MachineStatus machineStatus)
        {
            if (id != machineStatus.Id) return BadRequest();

            var existing = await _context.MachineStatuses.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
            if (existing == null) return NotFound();

            _context.Entry(machineStatus).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw;
            }

            return Ok(machineStatus);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMachineStatus(int id)
        {
            var status = await _context.MachineStatuses.FindAsync(id);
            if (status == null) return NotFound();

            _context.MachineStatuses.Remove(status);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}