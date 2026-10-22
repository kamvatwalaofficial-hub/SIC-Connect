using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

public record SkillDto(int Id, string Name, string? Level);
public record SkillInputDto(string Name, string? Level);

public record CertificationDto(int Id, string Name, string? Issuer, DateTime? IssuedOn, string? CredentialUrl);
public record CertificationInputDto(string Name, string? Issuer, DateTime? IssuedOn, string? CredentialUrl);

/// <summary>Full profile as returned by <c>GET /api/profiles/me</c>.</summary>
public record ProfileDto(
    int Id,
    int UserId,
    string Email,
    string FullName,
    string? Cohort,
    string? Location,
    string? Industry,
    EmploymentStatus EmploymentStatus,
    string? Bio,
    string? Headline,
    string? AvatarUrl,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? CvUrl,
    bool IsMentor,
    UserRole Role,
    IReadOnlyList<SkillDto> Skills,
    IReadOnlyList<CertificationDto> Certifications,
    IReadOnlyList<ProjectDto> Projects);

/// <summary>Editable fields for <c>PUT /api/profiles/me</c>. Skills/certs replace the existing sets.</summary>
public record UpdateProfileDto(
    string FullName,
    string? Cohort,
    string? Location,
    string? Industry,
    EmploymentStatus EmploymentStatus,
    string? Bio,
    string? Headline,
    string? AvatarUrl,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? CvUrl,
    bool IsMentor,
    IReadOnlyList<SkillInputDto>? Skills,
    IReadOnlyList<CertificationInputDto>? Certifications);
