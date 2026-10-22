using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

/// <summary>A pending (or reviewed) registration shown in the admin Account Approval Queue.</summary>
public record AccountApprovalDto(
    int UserId,
    string Email,
    string FullName,
    UserRole Role,
    string? Cohort,
    string? Location,
    string? Industry,
    string? Headline,
    IReadOnlyList<string> Skills,
    AccountStatus Status,
    string? ReviewNote,
    DateTime RequestedAt,
    DateTime? ReviewedAt);

/// <summary>Payload for reject / request-more-information actions (an explanatory note).</summary>
public record ReviewAccountDto(string? Note);
