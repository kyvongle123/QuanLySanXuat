using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("SaleOrders")]
    public class SaleOrder
    {
        [Key]
        public int ID { get; set; }

        [MaxLength(50)]
        public string? SaleOrderCode { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? DeliveryDate { get; set; }

        [MaxLength(200)]
        public string? Note { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; } = DateTime.Now;
        public int? CreatedBy { get; set; }
        public int? Status { get; set; }
        public int? PIC { get; set; }
    }
}