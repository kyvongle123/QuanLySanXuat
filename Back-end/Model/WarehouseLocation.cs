using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Warehouse_locations")]
    public class WarehouseLocation
    {
        [Key]
        public int ID { get; set; }

        public int? Bin { get; set; }

        public int? Racks { get; set; }

        public int? Level { get; set; }
    }
}