using System;
using System.Collections.Generic;

namespace MyProject.Backend.Model;

public partial class TransportRoute
{
    public int Id { get; set; }

    public int? From { get; set; }

    public int? To { get; set; }

    public int? Driver { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? TransportVehicle { get; set; }
}
