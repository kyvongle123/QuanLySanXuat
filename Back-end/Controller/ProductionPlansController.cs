using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using MyProject.Dto;
using MyProject.Service;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductionPlansController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ProductionPlanInfoService _productionPlanService;

        public ProductionPlansController(AppDbContext context, ProductionPlanInfoService productionPlanService)
        {
            _context = context;
            _productionPlanService = productionPlanService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionPlan>>> GetProductionPlans()
        {
            return await _context.ProductionPlans.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionPlan>> GetProductionPlan(int id)
        {
            var plan = await _context.ProductionPlans.FindAsync(id);
            if (plan == null) return NotFound();
            return plan;
        }

        [HttpPost]
        public async Task<ActionResult<ProductionPlan>> PostProductionPlan(CreateProductionPlanDto dto)
        {
            try
            {
                var plan = await _productionPlanService.CreatePlanWithItemsAsync(dto);
                return CreatedAtAction(nameof(GetProductionPlan), new { id = plan.Id }, plan);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("PlanCode", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductionPlan(int id, CreateProductionPlanDto dto)
        {
            var updatedPlan = await _productionPlanService.UpdatePlanWithItemsAsync(id, dto);
            if (updatedPlan == null) return NotFound();
            return Ok(updatedPlan);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductionPlan(int id)
        {
            var plan = await _context.ProductionPlans.FindAsync(id);
            if (plan == null) return NotFound();

            var planItems = await _context.ProductionPlanItems
                .Where(item => item.ProductionPlan == id)
                .ToListAsync();

            _context.ProductionPlanItems.RemoveRange(planItems);
            _context.ProductionPlans.Remove(plan);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
