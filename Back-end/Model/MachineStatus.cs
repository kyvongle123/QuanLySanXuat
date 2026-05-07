using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model
{
    [Table("Machine_Statuses")]
    public class MachineStatus
    {
        [Key]
        [Column("ID")]
        public int Id { get; set; }

        [MaxLength(50)]
        public string? Name { get; set; }
    }
}