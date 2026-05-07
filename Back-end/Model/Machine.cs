using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Machines")]
    public partial class Machine
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        public int? MachineType { get; set; }

        public DateTime? ProductionDate { get; set; }

        public DateTime? CommissioningDate { get; set; }

        public int? Status { get; set; }

        [MaxLength(50)]
        public string? MachineCode { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? TotalRunningHours { get; set; }

        public DateTime? LastMaintainance { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? OEETarget { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int? CreatedBy { get; set; }
    }
}