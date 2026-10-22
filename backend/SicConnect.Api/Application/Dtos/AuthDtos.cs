using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

/// <summary>Registration payload — creates a User and its empty AlumniProfile.</summary>
public record RegisterDto(string Email, string Password, string FullName, string? Cohort);

/// <summary>Login payload.</summary>
public record LoginDto(string Email, string Password);

/// <summary>Issued on successful register/login: the bearer token and the caller identity.</summary>
public record AuthResponseDto(
    string Token,
    DateTime ExpiresAt,
    int UserId,
    string Email,
    string FullName,
    UserRole Role);

/// <summary>
/// Returned from registration. New accounts are held for administrator approval, so no token
/// is issued — the client shows a "pending approval" message and directs the user to sign in
/// once approved.
/// </summary>
public record RegistrationResultDto(
    AccountStatus Status,
    string Message,
    bool RequiresApproval);
