﻿﻿﻿﻿﻿using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using MyProject.API.Models;
using MyProject.Backend.Model;
using MyProject.Backend.Models;

namespace MyProject.Backend.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Bom> Boms { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Driver> Drivers { get; set; }

    public virtual DbSet<Item> Items { get; set; }

    public virtual DbSet<ItemStatus> ItemStatuses { get; set; }

    public virtual DbSet<Material> Materials { get; set; }

    public virtual DbSet<MaterialCategory> MaterialCategories { get; set; }

    public virtual DbSet<ProductionCapacity> ProductionCapacities { get; set; }

    public virtual DbSet<ProductionOrder> ProductionOrders { get; set; }

    public virtual DbSet<ProductionPlan> ProductionPlans { get; set; }

    public virtual DbSet<ProductionPlanItem> ProductionPlanItems { get; set; }

    public virtual DbSet<ProductionOrderStatus> ProductionOrderStatuses { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Status> Statuses { get; set; }

    public virtual DbSet<TransportRoute> TransportRoutes { get; set; }

    public virtual DbSet<TransportVehicle> TransportVehicles { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<JobOrderItem> JobOrderItems { get; set; }

    public virtual DbSet<JobOrder> JobOrders { get; set; }

    public virtual DbSet<SaleOrderItem> SaleOrderItems { get; set; }

    public virtual DbSet<SaleOrder> SaleOrders { get; set; }

    public virtual DbSet<Stage> Stages { get; set; }

    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<Unit> Units { get; set; }

    public virtual DbSet<ProductionSection> ProductionSections { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Warehouse> Warehouses { get; set; }

    public virtual DbSet<WarehouseBin> WarehouseBins { get; set; }

    public virtual DbSet<WarehouseRack> WarehouseRacks { get; set; }

    public virtual DbSet<WarehouseType> WarehouseTypes { get; set; }

    public virtual DbSet<VehicleBrand> VehicleBrands { get; set; }

    public virtual DbSet<WarehouseStatus> WarehouseStatuses { get; set; }

    public virtual DbSet<WarehouseLocation> WarehouseLocations { get; set; }

    public virtual DbSet<MachineStatus> MachineStatuses { get; set; }

    public virtual DbSet<Machine> Machines { get; set; }

    public virtual DbSet<MachineType> MachineTypes { get; set; }

    public virtual DbSet<MaterialReceipt> MaterialReceipts { get; set; }

    public virtual DbSet<MaterialReceiptBatch> MaterialReceiptBatches { get; set; }
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Chỉ cấu hình ở đây nếu optionsBuilder chưa được cấu hình từ Program.cs
        if (!optionsBuilder.IsConfigured)
        {
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bom>(entity =>
        {
            entity.ToTable("BOM").HasKey(e => e.Id);

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.RequiredQuantity).HasColumnType("decimal(18, 6)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<Driver>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.NationalIdNumber).HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(50);
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Material).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Tax).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.Weight).HasColumnType("decimal(18, 2)");
        });

        modelBuilder.Entity<ItemStatus>(entity =>
        {
            entity.ToTable("Item_statuses").HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<Material>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Unit).HasMaxLength(10);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<MaterialCategory>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Unit).HasMaxLength(50);
        });

        modelBuilder.Entity<ProductionCapacity>(entity =>
        {
            entity.ToTable("ProductionCapacities");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");

            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<ProductionOrder>(entity =>
        {
            entity.ToTable("ProductionOrders").HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID").ValueGeneratedOnAdd();
            entity.Property(e => e.OrderCode).HasMaxLength(50);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.Status).HasColumnName("Status");
            entity.Property(e => e.Warehouse).HasColumnName("Warehouse");
            entity.Property(e => e.ProductionPlan).HasColumnName("ProductionPlan");
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
        });

        modelBuilder.Entity<ProductionPlan>(entity =>
        {
            entity.ToTable("ProductionPlans").HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID").ValueGeneratedOnAdd();
            entity.Property(e => e.PlanCode).HasMaxLength(50);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<ProductionPlanItem>(entity =>
        {
            entity.ToTable("ProductionPlan_Items").HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID").ValueGeneratedOnAdd();
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.PlannedDate).HasColumnType("datetime");
            entity.Property(e => e.ProductionPlan).HasColumnName("ProductionPlan");
            entity.Property(e => e.Item).HasColumnName("Item");
        });

        modelBuilder.Entity<ProductionOrderStatus>(entity =>
        {
            entity.ToTable("ProductionOrder_Statuses").HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");

            entity.Property(e => e.Name).HasMaxLength(255);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<Status>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<TransportRoute>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<TransportVehicle>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.LicensePlate).HasMaxLength(50);
            entity.Property(e => e.VehicleCode).HasMaxLength(50);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Address).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Password).HasMaxLength(255); // Tăng độ dài để chứa chuỗi Hash
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UserCode).HasMaxLength(50);
            entity.Property(e => e.Username).HasMaxLength(50);
            entity.Property(e => e.UserAvatar).HasColumnName("UserAvatar"); // Ánh xạ tới cột UserAvatar trong SQL
        });

        modelBuilder.Entity<VehicleBrand>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            // Cấu hình cụ thể cho cột ContactPerson nếu cần
            entity.Property(e => e.ContactPerson)
                    .HasMaxLength(50);

            // Các cấu hình khác...
        });

        modelBuilder.Entity<Machine>(entity =>
        {
            entity.ToTable("Machines").HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID").ValueGeneratedOnAdd();
            entity.Property(e => e.MachineCode).HasMaxLength(50);
            entity.Property(e => e.TotalRunningHours).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OEETarget).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ProductionDate).HasColumnType("datetime");
            entity.Property(e => e.CommissioningDate).HasColumnType("datetime");
            entity.Property(e => e.LastMaintainance).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<MaterialReceipt>(entity =>
        {
            entity.ToTable("MaterialReceipts").HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID").ValueGeneratedOnAdd();
            entity.Property(e => e.MaterialReceiptCode).HasMaxLength(50);
            entity.Property(e => e.DeliveryNoteNumber).HasMaxLength(50);
            entity.Property(e => e.ReceivingDate).HasColumnType("datetime");
            entity.Property(e => e.ExpiredDate).HasColumnType("datetime");
            entity.Property(e => e.SpecialStorageCondition).HasMaxLength(50);
            entity.Property(e => e.InspectationReport).HasMaxLength(255);
            entity.Property(e => e.CertificateOfOrigin).HasMaxLength(255);
            entity.Property(e => e.CertificateOfQuality).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });
    }
}
