using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

/// <summary>An application to an opportunity (from the applicant's or admin's perspective).</summary>
public record ApplicationDto(
    int Id,
    int OpportunityId,
    string OpportunityTitle,
    string Organisation,
    OpportunityType OpportunityType,
    int ApplicantUserId,
    string ApplicantName,
    ApplicationStatus Status,
    string? CoverNote,
    DateTime CreatedAt);

/// <summary>Apply to an opportunity.</summary>
public record CreateApplicationDto(string? CoverNote);

/// <summary>Admin updates an application's status.</summary>
public record UpdateApplicationStatusDto(ApplicationStatus Status);
