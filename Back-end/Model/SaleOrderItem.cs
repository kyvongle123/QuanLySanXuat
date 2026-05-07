using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("SaleOrder_Items")]
    public class SaleOrderItem
    {
        [Key]
        public int ID { get; set; }

        public int? SaleOrder { get; set; }
        public int? Quantity { get; set; }
        public int? Price { get; set; }
    }
}