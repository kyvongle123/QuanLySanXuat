using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.API.Models
{
    [Table("Warehouse_Bins")]
    public class WarehouseBin
    {
        [Key]
        public int ID { get; set; }
        [Required]
        public string Name { get; set; }
    }
}