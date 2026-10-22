namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// A showcase project uploaded by an alumnus: tech stack, source and demo links, and
/// any notable achievements.
/// </summary>
public class Project
{
    public int Id { get; set; }
    public int ProfileId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? TechStack { get; set; }
    public string? GitHubUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? Achievements { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public AlumniProfile Profile { get; set; } = null!;
}
