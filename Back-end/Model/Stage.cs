using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Stages")]
    public class Stage
    {
        [Key]
        public int ID { get; set; }

        [Required]
        [StringLength(50)]
        public string StageCode { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        public int Sequence { get; set; }

        public int ProductionSection { get; set; }
    }
}