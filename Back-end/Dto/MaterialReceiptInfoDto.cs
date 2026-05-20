using System;
using System.Collections.Generic;

namespace MyProject.Dto
{
    public class MaterialReceiptInfoDto
    {
        public int Id { get; set; }
        public string? MaterialReceiptCode { get; set; }
        public string? DeliveryNoteNumber { get; set; }
        public DateTime? ReceivingDate { get; set; }
        public DateTime? ExpiredDate { get; set; }
        public int? Status { get; set; }
        public int? Warehouse { get; set; }
        public int? Supplier { get; set; }
        public string? SpecialStorageCondition { get; set; }
        public int? Receiver { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? InspectationReport { get; set; }
        public string? CertificateOfOrigin { get; set; }
        public string? CertificateOfQuality { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<int>? InspectorPanel { get; set; }
        public List<MaterialReceiptBatchDto> MaterialReceiptBatchList { get; set; } = new(); // Danh sách lô hàng chi tiết
    }
}