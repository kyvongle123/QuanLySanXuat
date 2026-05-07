using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    public class MaterialReceipt
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(50)]
        public string? MaterialReceiptCode { get; set; }

        [MaxLength(50)]
        public string? DeliveryNoteNumber { get; set; }

        public DateTime? ReceivingDate { get; set; }

        public DateTime? ExpiredDate { get; set; }

        public int? QualityStatus { get; set; }

        public int? Warehouse { get; set; }

        public int? Supplier { get; set; }

        [MaxLength(255)]
        public string? SpecialStorageCondition { get; set; }

        [MaxLength(255)]
        public string? InspectationReport { get; set; }

        public int? Receiver { get; set; }

        [MaxLength(255)]
        public string? CertificateOfOrigin { get; set; }

        [MaxLength(255)]
        public string? CertificateOfQuality { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? CreatedBy { get; set; }

        // Navigation property để lấy danh sách lô hàng chi tiết
        public virtual ICollection<MaterialReceiptBatch> MaterialReceiptBatches { get; set; } = new List<MaterialReceiptBatch>();
    }
}