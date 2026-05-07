using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model;

[Table("ProductionPlan_Items")]
public partial class ProductionPlanItem
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    public int? ProductionPlan { get; set; }

    public int? Item { get; set; }

    public int? Quantity { get; set; }

    public DateTime? PlannedDate { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}