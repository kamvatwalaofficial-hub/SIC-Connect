using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

/// <summary>Filters for the community directory search. All optional; combined with AND.</summary>
public record DirectoryQueryDto(
    string? Skill,
    string? Cohort,
    string? Location,
    string? Industry,
    EmploymentStatus? EmploymentStatus,
    bool? MentorsOnly,
    string? Q,
    int Page = 1,
    int PageSize = 20);

/// <summary>A single directory result — a trimmed public view of a profile.</summary>
public record DirectoryItemDto(
    int UserId,
    string FullName,
    string? Cohort,
    string? Location,
    string? Industry,
    EmploymentStatus EmploymentStatus,
    string? Headline,
    string? AvatarUrl,
    bool IsMentor,
    IReadOnlyList<string> Skills,
    string? LinkedInUrl,
    string? GitHubUrl);

/// <summary>Paged wrapper returned by list/search endpoints.</summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;
}
