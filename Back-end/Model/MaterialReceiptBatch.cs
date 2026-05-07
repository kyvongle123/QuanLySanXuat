using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("MaterialReceipt_Batches")]
    public class MaterialReceiptBatch
    {
        [Key]
        public int Id { get; set; }

        public string? BatchCode { get; set; }

        [Required]
        [Column("MaterialReceipt")] // Map thuộc tính này với cột 'MaterialReceipt' trong SQL
        public int MaterialReceiptId { get; set; }

        [ForeignKey("MaterialReceiptId")]
        public virtual MaterialReceipt? MaterialReceipt { get; set; }

        [Required]
        [Column("Material")] // Map thuộc tính này với cột 'Material' trong SQL
        public int MaterialId { get; set; }

        [ForeignKey("MaterialId")]
        public virtual Material? Material { get; set; }

        public DateTime? MFGDate { get; set; }

        public DateTime? ExpiredDate { get; set; }

        public int ShippedQuantity { get; set; }

        public int DeliveredQuantity { get; set; }
    
        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int? CreatedBy { get; set; }
    }
}