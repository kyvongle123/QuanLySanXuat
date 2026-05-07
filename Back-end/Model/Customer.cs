using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Customers")]
    public class Customer
    {
        [Key]
        public int ID { get; set; }

        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? CustomerCode { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; } = DateTime.Now;
        public int? CreatedBy { get; set; }
    }
}