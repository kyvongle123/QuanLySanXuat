using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Suppliers")]
    public class Supplier
    {
        [Key]
        public int ID { get; set; }

        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? SupplierCode { get; set; }
        public string? ContactPerson { get; set; }
        public string? TaxCode { get; set; }
        public string? Website  { get; set; }
        public string? Note { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; } = DateTime.Now;
        public int? CreatedBy { get; set; }
    }
}