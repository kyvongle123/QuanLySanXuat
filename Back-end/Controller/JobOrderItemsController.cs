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
    public class JobOrderItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobOrderItemsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/JobOrderItems
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobOrderItem>>> GetJobOrderItems()
        {
            return await _context.JobOrderItems.ToListAsync();
        }

        // GET: api/JobOrderItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<JobOrderItem>> GetJobOrderItem(int id)
        {
            var jobOrderItem = await _context.JobOrderItems.FindAsync(id);
            if (jobOrderItem == null)
            {
                return NotFound();
            }
            return jobOrderItem;
        }

        // POST: api/JobOrderItems
        [HttpPost]
        public async Task<ActionResult<JobOrderItem>> PostJobOrderItem(JobOrderItem jobOrderItem)
        {
            _context.JobOrderItems.Add(jobOrderItem);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetJobOrderItem), new { id = jobOrderItem.ID }, jobOrderItem);
        }

        // PUT: api/JobOrderItems/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutJobOrderItem(int id, JobOrderItem jobOrderItem)
        {
            if (id != jobOrderItem.ID)
            {
                return BadRequest("ID trong URL không khớp với ID của đối tượng.");
            }

            _context.Entry(jobOrderItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!JobOrderItemExists(id))
                {
                    return NotFound("Không tìm thấy mục đơn hàng công việc với ID này.");
                }
                else throw;
            }
            return NoContent();
        }

        // DELETE: api/JobOrderItems/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobOrderItem(int id)
        {
            var jobOrderItem = await _context.JobOrderItems.FindAsync(id);
            if (jobOrderItem == null) return NotFound("Không tìm thấy mục đơn hàng công việc với ID này.");
            _context.JobOrderItems.Remove(jobOrderItem);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool JobOrderItemExists(int id)
        {
            return _context.JobOrderItems.Any(e => e.ID == id);
        }
    }
}