using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialsController : ControllerBase
    {
        private const string MaterialCodePrefix = "NVL00";
        private const int MaxCreateMaterialCodeAttempts = 10;
        private readonly AppDbContext _context;

        public MaterialsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Material>>> GetMaterials()
        {
            return await _context.Materials.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Material>> GetMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();
            return material;
        }

        [HttpPost]
        public async Task<ActionResult<Material>> PostMaterial(Material material)
        {
            var hasProvidedMaterialCode = !string.IsNullOrWhiteSpace(material.MaterialCode);

            for (var attempt = 0; attempt < MaxCreateMaterialCodeAttempts; attempt++)
            {
                material.CreatedAt = DateTime.Now;
                material.UpdatedAt = DateTime.Now;

                if (!hasProvidedMaterialCode)
                {
                    material.MaterialCode = await GenerateNextMaterialCodeAsync();
                }
                else
                {
                    material.MaterialCode = material.MaterialCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Materials.Add(material);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetMaterial), new { id = material.Id }, material);
                }
                catch (DbUpdateException ex) when (IsUniqueMaterialCodeException(ex) && attempt < MaxCreateMaterialCodeAttempts - 1)
                {
                    await transaction.RollbackAsync();
                    _context.Entry(material).State = EntityState.Detached;
                    material.Id = 0;

                    if (hasProvidedMaterialCode)
                    {
                        return Conflict("MaterialCode đã tồn tại.");
                    }

                    material.MaterialCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh MaterialCode không trùng sau nhiều lần thử.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaterial(int id, Material material)
        {
            if (id != material.Id) return BadRequest();

            var existingMaterial = await _context.Materials.FindAsync(id);
            if (existingMaterial == null) return NotFound();

            material.UpdatedAt = DateTime.Now;
            material.CreatedAt = existingMaterial.CreatedAt;
            material.MaterialCode = existingMaterial.MaterialCode ?? await GenerateNextMaterialCodeAsync();

            _context.Entry(existingMaterial).CurrentValues.SetValues(material);

            // Chỉ giữ lại dòng này nếu Model Material thực sự có trường CreatedBy
            // Nếu không có, hãy xóa hoặc comment lại để tránh lỗi Build
            // _context.Entry(material).Property(x => x.CreatedBy).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MaterialExists(id)) return NotFound();
                else throw;
            }

            return Ok(existingMaterial);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();

            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool MaterialExists(int id)
        {
            return _context.Materials.Any(e => e.Id == id);
        }

        private async Task<string> GenerateNextMaterialCodeAsync()
        {
            var materialCodes = await _context.Materials
                .AsNoTracking()
                .Where(e => e.MaterialCode != null && e.MaterialCode.StartsWith(MaterialCodePrefix))
                .Select(e => e.MaterialCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var materialCode in materialCodes)
            {
                var numberText = materialCode[MaterialCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{MaterialCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueMaterialCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Materials_MaterialCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
