using System;
using System.Collections.Generic;

namespace MyProject.Backend.Model;

public partial class TransportVehicle
{
    public int Id { get; set; }

    public string? VehicleCode { get; set; }

    public string? LicensePlate { get; set; }
}
