namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// Join entity resolving the many-to-many between <see cref="Event"/> and <see cref="User"/>.
/// A user may register for an event at most once (enforced by a unique index).
/// </summary>
public class EventRegistration
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int UserId { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
