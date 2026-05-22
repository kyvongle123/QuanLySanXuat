using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Model; // Thay thế bằng namespace thực tế của bạn
using MyProject.Backend.Data;
using MyProject.Dto;

namespace MyProject.Service
{
    public class ProductionPlanInfoService
    {
        private const string PlanCodePrefix = "KH00";
        private const int MaxCreatePlanCodeAttempts = 10;
        private readonly AppDbContext _context;

        public ProductionPlanInfoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ProductionPlan> CreatePlanWithItemsAsync(CreateProductionPlanDto dto)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            var hasProvidedPlanCode = !string.IsNullOrWhiteSpace(dto.PlanCode);

            return await strategy.ExecuteAsync(async () =>
            {
                for (var attempt = 0; attempt < MaxCreatePlanCodeAttempts; attempt++)
                {
                    var planCode = hasProvidedPlanCode
                        ? dto.PlanCode.Trim()
                        : await GenerateNextPlanCodeAsync();

                    await using var transaction = await _context.Database.BeginTransactionAsync();
                    var plan = new ProductionPlan
                    {
                        PlanCode = planCode,
                        StartDate = dto.StartDate,
                        EndDate = dto.EndDate,
                        Status = dto.Status,
                        Warehouse = dto.Warehouse,
                        Note = dto.Note
                    };

                    try
                    {
                        _context.ProductionPlans.Add(plan);
                        await _context.SaveChangesAsync();

                        if (dto.ProductionPlanItemList != null && dto.ProductionPlanItemList.Any())
                        {
                            var items = dto.ProductionPlanItemList.Select(i => new ProductionPlanItem
                            {
                                ProductionPlan = plan.Id,
                                Item = i.Item,
                                Quantity = i.Quantity
                            });
                            _context.ProductionPlanItems.AddRange(items);
                            await _context.SaveChangesAsync();
                        }

                        await transaction.CommitAsync();
                        return plan;
                    }
                    catch (DbUpdateException ex) when (IsUniquePlanCodeException(ex))
                    {
                        await transaction.RollbackAsync();
                        _context.Entry(plan).State = EntityState.Detached;
                        plan.Id = 0;

                        if (hasProvidedPlanCode || attempt >= MaxCreatePlanCodeAttempts - 1)
                        {
                            throw new InvalidOperationException("PlanCode đã tồn tại.", ex);
                        }
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }

                throw new InvalidOperationException("Không thể sinh PlanCode không trùng sau nhiều lần thử.");
            });
        }

        public async Task<ProductionPlan?> UpdatePlanWithItemsAsync(int id, CreateProductionPlanDto dto)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var plan = await _context.ProductionPlans.FindAsync(id);
                    if (plan == null) return null;

                    // Cập nhật thông tin chung
                    plan.PlanCode = string.IsNullOrWhiteSpace(plan.PlanCode)
                        ? await GenerateNextPlanCodeAsync()
                        : plan.PlanCode;
                    plan.StartDate = dto.StartDate;
                    plan.EndDate = dto.EndDate;
                    plan.Status = dto.Status;
                    plan.Warehouse = dto.Warehouse;
                    plan.Note = dto.Note;

                    // Xóa chi tiết cũ và thêm chi tiết mới (Logic ghi đè)
                    var oldItems = _context.ProductionPlanItems.Where(pi => pi.ProductionPlan == id);
                    _context.ProductionPlanItems.RemoveRange(oldItems);

                    // Thêm lại danh sách chi tiết mới
                    if (dto.ProductionPlanItemList != null && dto.ProductionPlanItemList.Any())
                    {
                        var items = dto.ProductionPlanItemList.Select(i => new ProductionPlanItem
                        {
                            ProductionPlan = plan.Id,
                            Item = i.Item,
                            Quantity = i.Quantity
                        });
                        _context.ProductionPlanItems.AddRange(items);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return plan;
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        private async Task<string> GenerateNextPlanCodeAsync()
        {
            var planCodes = await _context.ProductionPlans
                .AsNoTracking()
                .Where(e => e.PlanCode != null && e.PlanCode.StartsWith(PlanCodePrefix))
                .Select(e => e.PlanCode)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var planCode in planCodes)
            {
                var numberText = planCode[PlanCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{PlanCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniquePlanCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_ProductionPlans_PlanCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
