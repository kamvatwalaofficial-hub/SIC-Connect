namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// A per-user notification. In the prototype these are created in-app; email/push
/// delivery is a documented production seam.
/// </summary>
public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string Message { get; set; } = string.Empty;
    /// <summary>Optional in-app route the notification links to, e.g. "/events".</summary>
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}
