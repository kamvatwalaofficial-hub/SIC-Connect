using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Domain.Entities;

/// <summary>
/// A directional request between two users that becomes mutual once accepted. Covers both
/// peer connections and mentorship requests (see <see cref="ConnectionType"/>).
/// </summary>
public class Connection
{
    public int Id { get; set; }

    /// <summary>The user who initiated the request.</summary>
    public int RequesterId { get; set; }

    /// <summary>The user who receives (and accepts/declines) the request.</summary>
    public int AddresseeId { get; set; }

    public ConnectionType Type { get; set; } = ConnectionType.Connection;
    public ConnectionStatus Status { get; set; } = ConnectionStatus.Pending;

    /// <summary>Optional note included with the request.</summary>
    public string? Message { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    // Navigation
    public User Requester { get; set; } = null!;
    public User Addressee { get; set; } = null!;
}
