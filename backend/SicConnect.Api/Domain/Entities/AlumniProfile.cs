using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// The public-facing graduate profile. One-to-one with <see cref="User"/>; owns the
/// alumnus's skills, certifications and showcase projects.
/// </summary>
public class AlumniProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string? Cohort { get; set; }
    public string? Location { get; set; }
    public string? Industry { get; set; }
    public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.Unspecified;
    public string? Bio { get; set; }
    public string? Headline { get; set; }
    public string? AvatarUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }

    /// <summary>CV/résumé link. Placeholder for the prototype; blob storage is a production seam.</summary>
    public string? CvUrl { get; set; }

    /// <summary>Whether this alumnus has opted in as a mentor (surfaced in the directory).</summary>
    public bool IsMentor { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<Skill> Skills { get; set; } = new List<Skill>();
    public ICollection<Certification> Certifications { get; set; } = new List<Certification>();
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
