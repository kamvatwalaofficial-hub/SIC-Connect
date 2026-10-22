namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// A direct message between two users. Sending is only permitted between users who share an
/// accepted connection or mentorship (enforced in the messaging service). A null
/// <see cref="ReadAt"/> means the recipient has not yet read it.
/// </summary>
public class Message
{
    public int Id { get; set; }
    public int SenderId { get; set; }
    public int RecipientId { get; set; }

    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    // Navigation
    public User Sender { get; set; } = null!;
    public User Recipient { get; set; } = null!;
}
