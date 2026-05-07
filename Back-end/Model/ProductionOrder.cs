using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("ProductionOrders")]
    public partial class ProductionOrder
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [MaxLength(50)]
        public string? OrderCode { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public int? Status { get; set; }

        public int? Warehouse { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; } = DateTime.Now;
        public int? CreatedBy { get; set; }
        public int? ProductionPlan { get; set; }
    }
}