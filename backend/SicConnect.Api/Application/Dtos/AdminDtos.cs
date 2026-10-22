using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

/// <summary>A user row for the admin console user-management view.</summary>
public record AdminUserDto(
    int Id,
    string Email,
    string FullName,
    UserRole Role,
    AccountStatus Status,
    string? Cohort,
    string? Location,
    EmploymentStatus EmploymentStatus,
    bool IsMentor,
    IReadOnlyList<string> Skills,
    DateTime CreatedAt);

/// <summary>Payload to change a user's role from the admin console.</summary>
public record UpdateUserRoleDto(UserRole Role);

/// <summary>A mentorship request/relationship as seen by an administrator (read-only oversight).</summary>
public record AdminMentorshipDto(
    int Id,
    int AlumnusUserId,
    string AlumnusName,
    int MentorUserId,
    string MentorName,
    ConnectionStatus Status,
    string? Message,
    DateTime CreatedAt,
    DateTime? RespondedAt);
