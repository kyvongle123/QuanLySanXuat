using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Notifications")]
    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ID")]
        public int Id { get; set; }

        [Required]
        [StringLength(500)]
        [Column("Message")]
        public string Message { get; set; }

        [Required]
        [StringLength(50)]
        [Column("Type")]
        public string Type { get; set; }

        [StringLength(50)]
        [Column("Priority")]
        public string Priority { get; set; } = "normal";

        [Required]
        [StringLength(50)]
        [Column("Receiver")]
        public string Receiver { get; set; }

        [StringLength(50)]
        [Column("Sender")]
        public string Sender { get; set; }

        [StringLength(100)]
        [Column("ReferenceType")]
        public string ReferenceType { get; set; }

        [Column("ReferenceID")]
        public int? ReferenceId { get; set; }

        [Column("IsRead")]
        public bool IsRead { get; set; } = false;

        [Column("ReadAt")]
        public DateTime? ReadAt { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}