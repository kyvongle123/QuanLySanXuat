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
    public class MaterialReceiptBatchesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaterialReceiptBatchesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/MaterialReceiptBatches/ByReceipt/5
        [HttpGet("ByReceipt/{receiptId}")]
        public async Task<ActionResult<IEnumerable<MaterialReceiptBatch>>> GetByReceipt(int receiptId)
        {
            return await _context.MaterialReceiptBatches
                .Where(b => b.MaterialReceiptId == receiptId)
                .ToListAsync();
        }

        // POST: api/MaterialReceiptBatches
        [HttpPost]
        public async Task<ActionResult<MaterialReceiptBatch>> PostBatch(MaterialReceiptBatch batch)
        {
            _context.MaterialReceiptBatches.Add(batch);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetByReceipt), new { receiptId = batch.MaterialReceipt }, batch);
        }
    }
}