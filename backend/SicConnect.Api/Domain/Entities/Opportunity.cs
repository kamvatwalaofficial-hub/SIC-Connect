using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// A career opportunity published to the hub by an admin: jobs, internships, graduate
/// programmes, hackathons and scholarships.
/// </summary>
public class Opportunity
{
    public int Id { get; set; }
    public OpportunityType Type { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Organisation { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? ApplyUrl { get; set; }
    public DateTime? Deadline { get; set; }

    /// <summary>Flags an opportunity as prioritised for mentors/mentorship visibility.</summary>
    public bool IsMentorshipTagged { get; set; }

    public int PostedByAdminId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User PostedByAdmin { get; set; } = null!;
}
