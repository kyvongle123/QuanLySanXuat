using System;
using System.Collections.Generic;

namespace MyProject.Backend.Model;

public partial class User
{
    public string? Name { get; set; }

    public string? Email { get; set; }

    public int? Role { get; set; }

    public int? Status { get; set; }

    public int Id { get; set; }

    public string? Username { get; set; }

    public string? Password { get; set; }

    public string? UserCode { get; set; }

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public string? UserAvatar { get; set; }

    public int? MaterialReceipt { get; set;}

    public int? ProductionSection { get; set; }
}
