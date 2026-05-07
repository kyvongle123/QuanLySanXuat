using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Backend.Model;

[Table("ProductionCapacities")] // Thêm thuộc tính này
public partial class ProductionCapacity
{
    public int Id { get; set; }

    public int? Item { get; set; }

    public int? MaximumProductionQuantity { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
}