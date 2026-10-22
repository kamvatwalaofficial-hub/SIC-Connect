namespace SicConnect.Api.Application.Dtos;

/// <summary>Everything the administrator dashboard needs, aggregated read-only from existing tables.</summary>
public record AdminDashboardDto(
    AdminKpisDto Kpis,
    IReadOnlyList<CountByLabelDto> Engagement,
    int TotalAlumni,
    IReadOnlyList<CountByLabelDto> OpportunitiesByType,
    IReadOnlyList<UpcomingEventDto> UpcomingEvents,
    IReadOnlyList<TimePointDto> RegistrationsOverTime,
    IReadOnlyList<TimePointDto> OpportunitiesPerMonth,
    IReadOnlyList<TimePointDto> EventAttendanceOverTime,
    IReadOnlyList<CountByLabelDto> TopSkills,
    IReadOnlyList<CountByLabelDto> EmploymentStatusDistribution,
    IReadOnlyList<ActivityItemDto> RecentActivity,
    MentorshipStatsDto MentorshipStats,
    IReadOnlyList<MentorWorkloadDto> MentorWorkload,
    int PendingApprovals);

/// <summary>Platform-wide mentorship figures for the admin dashboard.</summary>
public record MentorshipStatsDto(
    int PendingRequests,
    int ActiveMentorships,
    int DeclinedRequests,
    int TotalMentors);

/// <summary>How many mentees a mentor has, plus outstanding requests — to monitor workload.</summary>
public record MentorWorkloadDto(
    int MentorUserId,
    string MentorName,
    int ActiveMentees,
    int PendingRequests);

/// <summary>The four headline KPI figures.</summary>
public record AdminKpisDto(
    int TotalAlumni,
    int ActiveOpportunities,
    int UpcomingEvents,
    int NewRegistrationsThisMonth);

/// <summary>A future event with its registration progress.</summary>
public record UpcomingEventDto(
    int Id,
    string Title,
    DateTime StartsAt,
    string? Venue,
    bool IsOnline,
    int AttendeeCount,
    int? Capacity);

/// <summary>A single point in a monthly time series (Label e.g. "Feb").</summary>
public record TimePointDto(string Label, int Value);

/// <summary>An entry in the recent-activity feed.</summary>
public record ActivityItemDto(string Type, string Title, string? Actor, DateTime Timestamp);
