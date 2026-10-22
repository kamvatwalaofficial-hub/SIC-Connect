namespace SicConnect.Api.Domain.Enums;

/// <summary>
/// Role-based access control tiers. Persisted as a string for readability in the database.
/// </summary>
public enum UserRole
{
    Alumni = 0,
    Mentor = 1,
    Admin = 2
}
