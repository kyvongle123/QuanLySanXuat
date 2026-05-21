using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    public class Material
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        public string? MaterialCode { get; set; }

        public int Name { get; set; }

        public int Location { get; set; }

        public int Quantity { get; set; }

        [MaxLength(50)]
        public string Unit { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; } = DateTime.Now;
        public int? CreatedBy { get; set; }

        public int? Item { get; set; }
        public int? MaterialCategory { get; set; }
    }
}