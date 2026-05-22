using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("BOM")]
    public class Bom
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        public string? BomCode { get; set; }

        // Thay đổi từ ItemCategory (ID danh mục) sang ItemId (ID sản phẩm)
        [Required]
        public int Item { get; set; }

        [Required]
        public int MaterialCategory { get; set; }

        [Required]
        public decimal RequiredQuantity { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
        
        public int? CreatedBy { get; set; }
    
    }
}
