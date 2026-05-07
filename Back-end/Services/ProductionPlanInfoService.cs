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
        private readonly AppDbContext _context;

        public ProductionPlanInfoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ProductionPlan> CreatePlanWithItemsAsync(CreateProductionPlanDto dto)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var plan = new ProductionPlan
                    {
                        PlanCode = dto.PlanCode,
                        StartDate = dto.StartDate,
                        EndDate = dto.EndDate,
                        Status = dto.Status,
                        Warehouse = dto.Warehouse,
                        Note = dto.Note
                    };

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
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        public async Task<ProductionPlan> UpdatePlanWithItemsAsync(int id, CreateProductionPlanDto dto)
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
                    plan.PlanCode = dto.PlanCode;
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
    }
}