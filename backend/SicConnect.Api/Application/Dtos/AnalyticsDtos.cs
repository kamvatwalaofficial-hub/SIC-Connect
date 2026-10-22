namespace SicConnect.Api.Application.Dtos;

/// <summary>Aggregated, read-only metrics for the admin analytics dashboard.</summary>
public record AnalyticsSummaryDto(
    int TotalUsers,
    int TotalAlumni,
    int TotalMentors,
    int TotalAdmins,
    int TotalProfiles,
    int TotalProjects,
    int TotalOpportunities,
    int TotalEvents,
    int TotalEventRegistrations,
    int TotalAnnouncements,
    int TotalConnections,
    int TotalApplications,
    IReadOnlyList<CountByLabelDto> UsersByCohort,
    IReadOnlyList<CountByLabelDto> AlumniByEmploymentStatus,
    IReadOnlyList<EventParticipationDto> TopEventsByRegistrations);

public record CountByLabelDto(string Label, int Count);

public record EventParticipationDto(int EventId, string Title, DateTime StartsAt, int RegistrationCount);
