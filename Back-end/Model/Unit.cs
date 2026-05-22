using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Unit")]
    public class Unit
    {
        [Key]
        public int ID { get; set; }

        public string? UnitCode { get; set; }

        [MaxLength(10)]
        public string? Name { get; set; }
    }
}