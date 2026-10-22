namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// A broadcast update published by an admin about opportunities, events or platform news.
/// </summary>
public class Announcement
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    /// <summary>Target audience label, e.g. "All", "Alumni", "Mentors".</summary>
    public string Audience { get; set; } = "All";

    public int PublishedByAdminId { get; set; }
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User PublishedByAdmin { get; set; } = null!;
}
