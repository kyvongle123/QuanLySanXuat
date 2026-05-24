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
    public class StagesController : ControllerBase
    {
        private const string StageCodePrefix = "QT00";
        private const int MaxCreateStageCodeAttempts = 10;
        private readonly AppDbContext _context;

        public StagesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Stage>>> GetStages()
        {
            return await _context.Stages.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Stage>> GetStage(int id)
        {
            var stage = await _context.Stages.FindAsync(id);
            if (stage == null) return NotFound();
            return stage;
        }

        [HttpPost]
        public async Task<ActionResult<Stage>> PostStage(Stage stage)
        {
            var hasProvidedStageCode = !string.IsNullOrWhiteSpace(stage.StageCode);

            for (var attempt = 0; attempt < MaxCreateStageCodeAttempts; attempt++)
            {
                if (!hasProvidedStageCode)
                {
                    stage.StageCode = await GenerateNextStageCodeAsync();
                }
                else
                {
                    stage.StageCode = stage.StageCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Stages.Add(stage);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetStage), new { id = stage.ID }, stage);
                }
                catch (DbUpdateException ex) when (IsUniqueStageCodeException(ex) && attempt < MaxCreateStageCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(stage).State = EntityState.Detached;
                    stage.ID = 0;

                    if (hasProvidedStageCode)
                    {
                        return Conflict("StageCode đã tồn tại.");
                    }

                    stage.StageCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh StageCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutStage(int id, Stage stage)
        {
            if (id != stage.ID) return BadRequest();

            var existingStage = await _context.Stages.FindAsync(id);
            if (existingStage == null) return NotFound();

            stage.StageCode = existingStage.StageCode ?? await GenerateNextStageCodeAsync();

            _context.Entry(existingStage).CurrentValues.SetValues(stage);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StageExists(id)) return NotFound();
                else throw;
            }

            return Ok(existingStage);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStage(int id)
        {
            var stage = await _context.Stages.FindAsync(id);
            if (stage == null) return NotFound();

            _context.Stages.Remove(stage);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool StageExists(int id)
        {
            return _context.Stages.Any(e => e.ID == id);
        }

        private async Task<string> GenerateNextStageCodeAsync()
        {
            var stageCodes = await _context.Stages
                .AsNoTracking()
                .Where(e => e.StageCode != null && e.StageCode.StartsWith(StageCodePrefix))
                .Select(e => e.StageCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var stageCode in stageCodes)
            {
                var numberText = stageCode[StageCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{StageCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueStageCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Stages_StageCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
