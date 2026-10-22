using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// The core aggregate. A User owns exactly one AlumniProfile and authenticates via a
/// BCrypt password hash. The Role claim drives authorization across the API.
/// </summary>
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Alumni;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ----- Account approval workflow -----
    /// <summary>Approval state. New users start Pending; existing rows migrate to Approved.</summary>
    public AccountStatus Status { get; set; } = AccountStatus.Pending;
    /// <summary>Administrator note for a rejection or an information request.</summary>
    public string? ReviewNote { get; set; }
    public DateTime? ReviewedAt { get; set; }
    /// <summary>Id of the admin who reviewed the account (audit trail; no navigation).</summary>
    public int? ReviewedByAdminId { get; set; }

    // Navigation
    public AlumniProfile? Profile { get; set; }
    public ICollection<EventRegistration> EventRegistrations { get; set; } = new List<EventRegistration>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
