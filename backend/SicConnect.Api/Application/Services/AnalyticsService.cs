using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Read-only analytics aggregated from the existing tables — no new writes. Powers the
/// admin analytics dashboard.
/// </summary>
public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db) => _db = db;

    public async Task<AnalyticsSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var totalUsers = await _db.Users.CountAsync(ct);
        var totalAlumni = await _db.Users.CountAsync(u => u.Role == UserRole.Alumni, ct);
        var totalMentors = await _db.Users.CountAsync(u => u.Role == UserRole.Mentor, ct);
        var totalAdmins = await _db.Users.CountAsync(u => u.Role == UserRole.Admin, ct);

        var totalProfiles = await _db.Profiles.CountAsync(ct);
        var totalProjects = await _db.Projects.CountAsync(ct);
        var totalOpportunities = await _db.Opportunities.CountAsync(ct);
        var totalEvents = await _db.Events.CountAsync(ct);
        var totalRegistrations = await _db.EventRegistrations.CountAsync(ct);
        var totalAnnouncements = await _db.Announcements.CountAsync(ct);
        var totalConnections = await _db.Connections
            .CountAsync(c => c.Status == Domain.Enums.ConnectionStatus.Accepted, ct);
        var totalApplications = await _db.OpportunityApplications.CountAsync(ct);
 

        var cohorts = await _db.Profiles
            .Where(p => p.Cohort != null && p.Cohort != "")
            .Select(p => p.Cohort!)
            .ToListAsync(ct);

        var usersByCohort = cohorts
            .GroupBy(c => c)
            .Select(g => new CountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var employmentStatuses = await _db.Profiles
            .Select(p => p.EmploymentStatus)
            .ToListAsync(ct);

        var byEmployment = employmentStatuses
            .GroupBy(e => e)
            .Select(g => new CountByLabelDto(g.Key.ToString(), g.Count()))
            .ToList();


        var topEventData = await _db.Events
            .OrderByDescending(e => e.Registrations.Count)
            .ThenBy(e => e.StartsAt)
            .Take(5)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.StartsAt,
                Registrations = e.Registrations.Count
            })
            .ToListAsync(ct);

        var topEvents = topEventData
            .Select(e => new EventParticipationDto(
                e.Id,
                e.Title,
                e.StartsAt,
                e.Registrations))
            .ToList();


        return new AnalyticsSummaryDto(
            totalUsers, totalAlumni, totalMentors, totalAdmins,
            totalProfiles, totalProjects, totalOpportunities, totalEvents,
            totalRegistrations, totalAnnouncements, totalConnections, totalApplications,
            usersByCohort, byEmployment, topEvents);
    }

    public async Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var windowStart = monthStart.AddMonths(-5); // rolling 6-month window

        // ---------- KPIs ----------
        var totalAlumni = await _db.Profiles.CountAsync(ct);
        var activeOpportunities = await _db.Opportunities
            .CountAsync(o => o.Deadline == null || o.Deadline >= now, ct);
        var upcomingEventsCount = await _db.Events.CountAsync(e => e.StartsAt >= now, ct);
        var newRegistrationsThisMonth = await _db.Users.CountAsync(u => u.CreatedAt >= monthStart, ct);

        var kpis = new AdminKpisDto(totalAlumni, activeOpportunities, upcomingEventsCount, newRegistrationsThisMonth);

        // ---------- Community engagement (mutually-exclusive buckets) ----------
        var profileFacts = await _db.Profiles
            .Select(p => new
            {
                p.IsMentor,
                p.EmploymentStatus,
                HasContent = p.Skills.Any() || p.Projects.Any()
            })
            .ToListAsync(ct);

        int mentors = 0, jobSeeking = 0, employed = 0, active = 0, inactive = 0;
        foreach (var p in profileFacts)
        {
            if (p.IsMentor) mentors++;
            else if (p.EmploymentStatus == EmploymentStatus.SeekingWork) jobSeeking++;
            else if (p.EmploymentStatus is EmploymentStatus.Employed or EmploymentStatus.SelfEmployed or EmploymentStatus.Freelancing) employed++;
            else if (p.HasContent) active++;
            else inactive++;
        }
        var engagement = new List<CountByLabelDto>
        {
            new("Active Alumni", active),
            new("Job Seeking", jobSeeking),
            new("Employed", employed),
            new("Mentors", mentors),
            new("Inactive Members", inactive),
        };

        // ---------- Opportunities by type (all types, including zero) ----------
        var oppCounts = await _db.Opportunities
            .GroupBy(o => o.Type)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var opportunitiesByType = Enum.GetValues<OpportunityType>()
            .Select(t => new CountByLabelDto(t.ToString(), oppCounts.FirstOrDefault(x => x.Type == t)?.Count ?? 0))
            .ToList();

        // ---------- Upcoming events with capacity ----------
        var upcomingEventData = await _db.Events
            .Where(e => e.StartsAt >= now)
            .OrderBy(e => e.StartsAt)
            .Take(5)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.StartsAt,
                e.Venue,
                e.IsOnline,
                Registrations = e.Registrations.Count,
                e.Capacity
            })
            .ToListAsync(ct);

        var upcomingEvents = upcomingEventData
            .Select(e => new UpcomingEventDto(
                e.Id,
                e.Title,
                e.StartsAt,
                e.Venue,
                e.IsOnline,
                e.Registrations,
                e.Capacity))
            .ToList();


        // ---------- Monthly time series ----------
        var regDates = await _db.Users.Where(u => u.CreatedAt >= windowStart).Select(u => u.CreatedAt).ToListAsync(ct);
        var oppDates = await _db.Opportunities.Where(o => o.CreatedAt >= windowStart).Select(o => o.CreatedAt).ToListAsync(ct);
        var attendanceDates = await _db.EventRegistrations.Where(r => r.RegisteredAt >= windowStart).Select(r => r.RegisteredAt).ToListAsync(ct);

        var registrationsOverTime = BucketByMonth(regDates, windowStart, 6);
        var opportunitiesPerMonth = BucketByMonth(oppDates, windowStart, 6);
        var eventAttendanceOverTime = BucketByMonth(attendanceDates, windowStart, 6);

        // ---------- Top skills ----------
        var skillCounts = await _db.Skills
            .GroupBy(s => s.Name)
            .Select(g => new
            {
                Name = g.Key,
                Count = g.Count()
            })
            .ToListAsync(ct);

        var topSkills = skillCounts
            .OrderByDescending(x => x.Count)
            .Take(8)
            .Select(x => new CountByLabelDto(
                x.Name,
                x.Count))
            .ToList();


        // ---------- Employment status distribution ----------
        var employmentStatusDistribution = (await _db.Profiles
            .GroupBy(p => p.EmploymentStatus)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(ct))
            .Select(x => new CountByLabelDto(x.Key.ToString(), x.Count))
            .OrderByDescending(x => x.Count)
            .ToList();

        // ---------- Recent activity (merged in memory) ----------
        var activity = new List<ActivityItemDto>();

        var recentUsers = await _db.Users.Include(u => u.Profile)
            .OrderByDescending(u => u.CreatedAt).Take(6).ToListAsync(ct);
        activity.AddRange(recentUsers.Select(u => new ActivityItemDto(
            "registration", $"{u.Profile?.FullName ?? u.Email} joined SIC Connect", u.Profile?.FullName, u.CreatedAt)));

        var recentOpps = await _db.Opportunities
            .OrderByDescending(o => o.CreatedAt).Take(6).ToListAsync(ct);
        activity.AddRange(recentOpps.Select(o => new ActivityItemDto(
            "opportunity", $"New {o.Type}: {o.Title}", o.Organisation, o.CreatedAt)));

        var recentRegs = await _db.EventRegistrations
            .Include(r => r.Event).Include(r => r.User).ThenInclude(u => u.Profile)
            .OrderByDescending(r => r.RegisteredAt).Take(6).ToListAsync(ct);
        activity.AddRange(recentRegs.Select(r => new ActivityItemDto(
            "event", $"Registered for {r.Event.Title}", r.User.Profile?.FullName ?? r.User.Email, r.RegisteredAt)));

        var recentAnnouncements = await _db.Announcements
            .OrderByDescending(a => a.PublishedAt).Take(4).ToListAsync(ct);
        activity.AddRange(recentAnnouncements.Select(a => new ActivityItemDto(
            "announcement", $"Announcement: {a.Title}", "Admin", a.PublishedAt)));

        var recentProfiles = await _db.Profiles.Include(p => p.User)
            .OrderByDescending(p => p.UpdatedAt).Take(6).ToListAsync(ct);
        activity.AddRange(recentProfiles
            .Where(p => p.UpdatedAt > p.User.CreatedAt.AddMinutes(1))
            .Select(p => new ActivityItemDto("profile", $"{p.FullName} updated their profile", p.FullName, p.UpdatedAt)));

        var recentActivity = activity
            .OrderByDescending(a => a.Timestamp)
            .Take(12)
            .ToList();

        // ---------- Mentorship stats & mentor workload (from Connection records) ----------
        var mentorshipLinks = await _db.Connections
            .Where(c => c.Type == ConnectionType.Mentorship)
            .Select(c => new { c.AddresseeId, c.Status })
            .ToListAsync(ct);

        var totalMentors = await _db.Profiles.CountAsync(p => p.IsMentor, ct);
        var mentorshipStats = new MentorshipStatsDto(
            PendingRequests: mentorshipLinks.Count(c => c.Status == ConnectionStatus.Pending),
            ActiveMentorships: mentorshipLinks.Count(c => c.Status == ConnectionStatus.Accepted),
            DeclinedRequests: mentorshipLinks.Count(c => c.Status == ConnectionStatus.Declined),
            TotalMentors: totalMentors);

        // Mentors (addressees of mentorship requests) with their active/pending counts.
        var mentorNames = await _db.Profiles.Include(p => p.User)
            .Where(p => p.IsMentor)
            .Select(p => new { p.UserId, p.FullName })
            .ToListAsync(ct);

        var mentorWorkload = mentorNames
            .Select(m => new MentorWorkloadDto(
                m.UserId,
                m.FullName,
                mentorshipLinks.Count(c => c.AddresseeId == m.UserId && c.Status == ConnectionStatus.Accepted),
                mentorshipLinks.Count(c => c.AddresseeId == m.UserId && c.Status == ConnectionStatus.Pending)))
            .OrderByDescending(m => m.ActiveMentees)
            .ThenByDescending(m => m.PendingRequests)
            .Take(8)
            .ToList();

        var pendingApprovals = await _db.Users.CountAsync(
            u => u.Status == AccountStatus.Pending || u.Status == AccountStatus.InfoRequested, ct);

        return new AdminDashboardDto(
            kpis, engagement, totalAlumni, opportunitiesByType, upcomingEvents,
            registrationsOverTime, opportunitiesPerMonth, eventAttendanceOverTime,
            topSkills, employmentStatusDistribution, recentActivity,
            mentorshipStats, mentorWorkload, pendingApprovals);
    }

    /// <summary>Buckets a materialised list of timestamps into <paramref name="months"/> monthly points.</summary>
    private static IReadOnlyList<TimePointDto> BucketByMonth(List<DateTime> dates, DateTime startMonth, int months)
    {
        var points = new List<TimePointDto>(months);
        for (var i = 0; i < months; i++)
        {
            var m = startMonth.AddMonths(i);
            var count = dates.Count(d => d.Year == m.Year && d.Month == m.Month);
            points.Add(new TimePointDto(m.ToString("MMM"), count));
        }
        return points;
    }
}
