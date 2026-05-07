using System;
using System.Collections.Generic;

namespace MyProject.Backend.Model;

public partial class Item
{
    public string? Name { get; set; }

    public string? Description { get; set; }

    public decimal? Price { get; set; }

    public int? Inventory { get; set; }

    public int? Category { get; set; }

    public int Id { get; set; }

    public int? Manufactory { get; set; }

    public string? Material { get; set; }

    public decimal? Tax { get; set; }

    public decimal? Weight { get; set; }

    public int? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? TransportVehicle { get; set; }

    public int? TransportRoute { get; set; }

    public int? Location { get; set; }
}
