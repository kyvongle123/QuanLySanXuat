using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.API.Models
{
    [Table("Warehouse_Racks")] // Đảm bảo ánh xạ đúng với tên bảng trong SQL
    public class WarehouseRack
    {
        [Key] // Đánh dấu ID là khóa chính
        public int ID { get; set; }
        public string Name { get; set; }
    }
}