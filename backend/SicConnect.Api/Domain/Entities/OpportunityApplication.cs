using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// An alumnus's application to an <see cref="Opportunity"/>. A user may apply at most once
/// per opportunity (enforced by a unique index).
/// </summary>
public class OpportunityApplication
{
    public int Id { get; set; }
    public int OpportunityId { get; set; }
    public int UserId { get; set; }

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public string? CoverNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public Opportunity Opportunity { get; set; } = null!;
    public User User { get; set; } = null!;
}
