using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("ProductionSections")]
    public class ProductionSection
    {
        [Key]
        public int ID { get; set; }

        [MaxLength(50)]
        public string? ProductionSectionCode { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        public int? Leader { get; set; }

        public int? BaseUnitCost { get; set; }

        public int? Status { get; set; }
    }
}