using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("JobOrder_Items")]
    public class JobOrderItem
    {
        [Key]
        public int ID { get; set; }

        public int JobOrder { get; set; }
        public int TargetQuantity { get; set; }
        public int CompletedQuantity { get; set; }
    }
}