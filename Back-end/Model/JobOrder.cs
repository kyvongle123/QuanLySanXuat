using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("JobOrders")]
    public class JobOrder
    {
        [Key]
        public int ID { get; set; }

        public string? JobOrderCode { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int? Section { get; set; }
    }
}