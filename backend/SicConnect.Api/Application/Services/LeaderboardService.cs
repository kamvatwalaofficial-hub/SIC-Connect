using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Recognition leaderboards. Ranks alumni and mentors by a recognition score ("XP")
/// derived entirely from data that already exists in the database — skills, certifications,
/// showcase projects, accepted connections and event registrations — so it needs no schema
/// change or migration. When the dedicated XP engine lands, only <see cref="ScoreExpression"/>
/// (the score source) needs to change; the ranking, top-N and self-rank logic stay the same.
/// </summary>
public class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _current;

    public LeaderboardService(AppDbContext db, ICurrentUser current)
    {
        _db = db;
        _current = current;
    }

    public async Task<LeaderboardResultDto> GetAsync(string board, int top, CancellationToken ct = default)
    {
        // "mentor" board ranks mentors only; anything else ("alumni") ranks alumni only.
        var isMentorBoard = string.Equals(board, "mentor", StringComparison.OrdinalIgnoreCase);
        var role = isMentorBoard ? UserRole.Mentor : UserRole.Alumni;
        var normalizedBoard = isMentorBoard ? "mentor" : "alumni";
        var takeTop = top is < 1 or > 100 ? 10 : top;

        // Project the raw counts in the database, then compute the score in memory. Counts
        // translate cleanly to SQL; keeping the weighting in C# avoids brittle SQL arithmetic
        // and keeps the single source of truth next to the constants above.
        var rows = await _db.Profiles
            .AsNoTracking()
            .Where(p => p.User.Role == role && p.User.Status == AccountStatus.Approved)
            .Select(p => new
            {
                p.UserId,
                p.FullName,
                p.Headline,
                p.AvatarUrl,
                p.Cohort,
                p.IsMentor,
                Skills = p.Skills.Count,
                Certifications = p.Certifications.Count,
                Projects = p.Projects.Count,
                Connections = _db.Connections.Count(c =>
                    c.Status == ConnectionStatus.Accepted &&
                    (c.RequesterId == p.UserId || c.AddresseeId == p.UserId)),
                Events = _db.EventRegistrations.Count(r => r.UserId == p.UserId),
            })
            .ToListAsync(ct);

        var ranked = rows
            .Select(r => new
            {
                r.UserId,
                r.FullName,
                r.Headline,
                r.AvatarUrl,
                r.Cohort,
                r.IsMentor,
                Xp = RecognitionScoring.Score(r.Skills, r.Certifications, r.Projects, r.Connections, r.Events),
            })
            // Highest XP first; stable tie-break by name so ranks are deterministic.
            .OrderByDescending(r => r.Xp)
            .ThenBy(r => r.FullName)
            .Select((r, i) => new LeaderboardEntryDto(
                Rank: i + 1,
                UserId: r.UserId,
                FullName: r.FullName,
                Headline: r.Headline,
                AvatarUrl: r.AvatarUrl,
                Cohort: r.Cohort,
                IsMentor: r.IsMentor,
                Xp: r.Xp,
                IsMe: r.UserId == _current.UserId))
            .ToList();

        var topEntries = ranked.Take(takeTop).ToList();
        var me = ranked.FirstOrDefault(e => e.IsMe);

        return new LeaderboardResultDto(normalizedBoard, topEntries, me, ranked.Count);
    }
}
