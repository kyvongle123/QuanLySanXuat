using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/JobOrders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobOrder>>> GetJobOrders()
        {
            return await _context.JobOrders.ToListAsync();
        }

        // GET: api/JobOrders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<JobOrder>> GetJobOrder(int id)
        {
            var jobOrder = await _context.JobOrders.FindAsync(id);
            if (jobOrder == null)
            {
                return NotFound();
            }
            return jobOrder;
        }

        // POST: api/JobOrders
        [HttpPost]
        public async Task<ActionResult<JobOrder>> PostJobOrder(JobOrder jobOrder)
        {
            _context.JobOrders.Add(jobOrder);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetJobOrder), new { id = jobOrder.ID }, jobOrder);
        }

        // PUT: api/JobOrders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutJobOrder(int id, JobOrder jobOrder)
        {
            if (id != jobOrder.ID)
            {
                return BadRequest("ID không khớp.");
            }

            _context.Entry(jobOrder).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!JobOrderExists(id)) return NotFound();
                else throw;
            }
            return Ok(jobOrder);
        }

        // DELETE: api/JobOrders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobOrder(int id)
        {
            var jobOrder = await _context.JobOrders.FindAsync(id);
            if (jobOrder == null) return NotFound();
            _context.JobOrders.Remove(jobOrder);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool JobOrderExists(int id)
        {
            return _context.JobOrders.Any(e => e.ID == id);
        }
    }
}