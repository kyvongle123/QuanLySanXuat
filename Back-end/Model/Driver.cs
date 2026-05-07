using System;
using System.Collections.Generic;

namespace MyProject.Backend.Model;

public partial class Driver
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? NationalIdNumber { get; set; }

    public string Phone { get; set; } = null!;

    public string? Email { get; set; }
}
