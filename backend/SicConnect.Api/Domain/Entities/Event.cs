namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// A community event created by an admin. Alumni browse, view detail and register to
/// attend via <see cref="EventRegistration"/> (a many-to-many join with User).
/// </summary>
public class Event
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string? Venue { get; set; }
    public bool IsOnline { get; set; }
    public int? Capacity { get; set; }

    public int CreatedByAdminId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User CreatedByAdmin { get; set; } = null!;
    public ICollection<EventRegistration> Registrations { get; set; } = new List<EventRegistration>();
}
