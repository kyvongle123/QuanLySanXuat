using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Warehouses")]
    public class Warehouse
    {
        [Key]
        public int ID { get; set; }

        public string? WarehouseCode { get; set; }

        public int Type { get; set; }
        
        public int Available { get; set; }

        public int Location { get; set; }
    }
}