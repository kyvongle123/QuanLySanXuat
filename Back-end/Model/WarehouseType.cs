using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.API.Models
{
    [Table("Warehouse_Types")]
    public class WarehouseType
    {
        [Key]
        public int ID { get; set; }
        public string Name { get; set; }
    }
}