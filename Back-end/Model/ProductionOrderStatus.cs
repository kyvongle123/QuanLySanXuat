using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    public class ProductionOrderStatus
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        public string Name { get; set; } = null!;
    }
}