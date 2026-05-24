using System;
using System.Collections.Generic;

namespace MyProject.Dto
{

    public class InspectationCommitteeInfoDto
    {
        public string userCode { get; set; }
        public string Name { get; set; }
        public int isLeader { get; set; }
    }
    public class MaterialReceiptInfoDto
    {
        public int Id { get; set; }
        public string? MaterialReceiptCode { get; set; }
        public string? DeliveryNoteNumber { get; set; }
        public DateTime? ReceivingDate { get; set; }
        public DateTime? ExpiredDate { get; set; }
        public int? Status { get; set; }
        public int? Supplier { get; set; }
        public string? SpecialStorageCondition { get; set; }
        public int? Receiver { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? InspectationReport { get; set; }
        public string? CertificateOfOrigin { get; set; }
        public string? CertificateOfQuality { get; set; }
        public List<InspectationCommitteeInfoDto> InspectationCommitteeList { get; set; } = new();
        public DateTime? UpdatedAt { get; set; }
        public List<MaterialReceiptBatchDto> MaterialReceiptBatchList { get; set; } = new(); // Danh sách lô hàng chi tiết
    }
}