using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Interfaces;

/// <summary>Ambient accessor for the authenticated caller, derived from the JWT principal.</summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    int UserId { get; }
    string? Email { get; }
    UserRole Role { get; }
    bool IsAdmin { get; }
}
