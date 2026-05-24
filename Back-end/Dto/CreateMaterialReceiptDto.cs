using System;
using System.Collections.Generic;

namespace MyProject.Dto
{
    public class MaterialReceiptBatchDto
    {
        public int MaterialReceipt { get; set; }
        public int MaterialId { get; set;}
        public int ShippedQuantity { get; set; }
        public int DeliveredQuantity { get; set; }
        public string? BatchCode { get; set; }
        public DateTime? MFGDate { get; set; }
        public DateTime? ExpiredDate { get; set; }
        // Các trường CreatedAt, UpdatedAt, CreatedBy, ID, MaterialReceipt sẽ được xử lý ở tầng Service/Model
        // và không cần thiết trong DTO khi tạo/cập nhật
    }

    public class CreateMaterialReceiptDto
    {
        public int Id { get; set; }
        public string? MaterialReceiptCode { get; set; }
        public string? DeliveryNoteNumber { get; set; }
        public DateTime? ReceivingDate { get; set; }
        public DateTime? ExpiredDate { get; set; }
        public int? Status { get; set; }
        public int? Supplier { get; set; }
        public string? SpecialStorageCondition { get; set; }
        public string? InspectationReport { get; set; }
        public IFormFile? InspectationReportFile { get; set; }
        public int? Receiver { get; set; }
        public string? CertificateOfOrigin { get; set; }
        public IFormFile? CertificateOfOriginFile { get; set; }
        public string? CertificateOfQuality { get; set; }
        public IFormFile? CertificateOfQualityFile { get; set; }
        public string? CreatedBy { get; set; }
        public List<MaterialReceiptBatchDto> MaterialReceiptBatchList { get; set; } = new();
        public string? InspectationCommitteeLeader { get; set; }

        public string? InspectationCommittee1 { get; set; }

        public string? InspectationCommittee2 { get; set; }
    }

    public class ReceiveMaterialReceiptBatchDto
    {
        public int MaterialId { get; set; }
        public int DeliveredQuantity { get; set; }
    }

    public class ReceiveMaterialReceiptDto
    {
        public List<ReceiveMaterialReceiptBatchDto> Items { get; set; } = new();
    }
}
