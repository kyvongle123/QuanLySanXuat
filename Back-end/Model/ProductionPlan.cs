using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model;

[Table("ProductionPlans")]
public partial class ProductionPlan
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [MaxLength(50)]
    public string PlanCode { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int? Status { get; set; }

    public int? Warehouse { get; set; }

    [MaxLength(500)]
    public string Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
}