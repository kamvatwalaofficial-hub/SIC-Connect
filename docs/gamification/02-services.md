# 02 — XP engine, Badge service & Leaderboards

Interfaces go in `Application/Interfaces/IServices.cs` (or a new `IRecognitionServices.cs`);
implementations in `Application/Services/`. They follow the exact constructor-injection
pattern used by the existing services (`AppDbContext`, `ICurrentUser`, `INotificationService`).

## Interfaces

```csharp
public interface IXpService
{
    /// <summary>Awards XP for an action, idempotently. Safe to call more than once for the
    /// same (actionKey, referenceType, referenceId) — duplicates are ignored. Returns what
    /// happened so the caller can surface a celebration.</summary>
    Task<XpAwardResult> AwardAsync(int userId, string actionKey,
        string? referenceType = null, int? referenceId = null, CancellationToken ct = default);

    Task<int> GetTotalAsync(int userId, CancellationToken ct = default);
    Task<IReadOnlyList<XpTransactionDto>> GetHistoryAsync(int userId, int take = 50, CancellationToken ct = default);
}

public interface IBadgeService
{
    /// <summary>Re-evaluates all active badge rules for a user and unlocks any newly earned
    /// badges (awarding their XP reward). Returns the badges unlocked by THIS call.</summary>
    Task<IReadOnlyList<BadgeDto>> EvaluateAsync(int userId, CancellationToken ct = default);

    Task<IReadOnlyList<BadgeDto>> GetForUserAsync(int userId, CancellationToken ct = default);
}

public interface ILeaderboardService
{
    Task<LeaderboardDto> GetAsync(string scope /* "Alumni" | "Mentor" */, int top = 10, CancellationToken ct = default);
}
```

## XpService (idempotent core)

```csharp
public class XpService : IXpService
{
    private readonly AppDbContext _db;
    private readonly IBadgeService _badges;
    private readonly INotificationService _notifications;

    public XpService(AppDbContext db, IBadgeService badges, INotificationService notifications)
    { _db = db; _badges = badges; _notifications = notifications; }

    public async Task<XpAwardResult> AwardAsync(int userId, string actionKey,
        string? referenceType = null, int? referenceId = null, CancellationToken ct = default)
    {
        var cfg = await _db.XpActionConfigs.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ActionKey == actionKey && c.IsActive, ct);
        if (cfg is null || cfg.Points == 0)
            return new XpAwardResult(0, await GetTotalAsync(userId, ct), Array.Empty<BadgeDto>());

        // Idempotency key: repeatable actions get a unique key; one-shot actions dedupe on
        // (action + reference), so the same event can never award twice.
        var idem = cfg.IsRepeatable
            ? $"{actionKey}:{referenceType}:{referenceId}:{Guid.NewGuid():N}"
            : $"{actionKey}:{referenceType}:{referenceId}:{userId}";

        if (!cfg.IsRepeatable &&
            await _db.XpTransactions.AnyAsync(t => t.IdempotencyKey == idem, ct))
            return new XpAwardResult(0, await GetTotalAsync(userId, ct), Array.Empty<BadgeDto>());

        _db.XpTransactions.Add(new XpTransaction
        {
            UserId = userId, ActionKey = actionKey, Points = cfg.Points,
            ReferenceType = referenceType, ReferenceId = referenceId,
            IdempotencyKey = idem, Note = cfg.DisplayName
        });

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile is not null) profile.TotalXp += cfg.Points;

        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateException)   // unique-index race on IdempotencyKey → already awarded
        { return new XpAwardResult(0, await GetTotalAsync(userId, ct), Array.Empty<BadgeDto>()); }

        var unlocked = await _badges.EvaluateAsync(userId, ct);   // may award more XP
        var total = await GetTotalAsync(userId, ct);
        return new XpAwardResult(cfg.Points, total, unlocked);
    }

    public Task<int> GetTotalAsync(int userId, CancellationToken ct = default) =>
        _db.Profiles.Where(p => p.UserId == userId).Select(p => p.TotalXp).FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<XpTransactionDto>> GetHistoryAsync(int userId, int take = 50, CancellationToken ct = default) =>
        await _db.XpTransactions.AsNoTracking().Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt).Take(take)
            .Select(t => new XpTransactionDto(t.ActionKey, t.Note, t.Points, t.CreatedAt))
            .ToListAsync(ct);
}
```

**Why this is safe:** XP is only ever written by the server in response to a trusted event;
there is no client-facing "add XP" endpoint. The unique `IdempotencyKey` index makes
double-awards impossible even under concurrency.

### Integration points (one line each — nothing else changes)

Inject `IXpService` into the existing services and add a single `AwardAsync` after the
state change succeeds. All keys are seeded in `05-migration-and-seed.md`.

| Existing service / action | Call |
|---|---|
| `ProfileService.UpdateMineAsync` (when profile becomes "complete") | `await _xp.AwardAsync(userId, "PROFILE_COMPLETED");` |
| `ProfileService` avatar set | `"PROFILE_PICTURE"` |
| `ProfileService` CV uploaded | `"CV_UPLOADED"` |
| `ProfileService` certification added | `"CERTIFICATION_UPLOADED", "Certification", certId` |
| `ProfileService` skills selected | `"SKILLS_SELECTED"` |
| `ProjectService.CreateAsync` | `"PROJECT_UPLOADED", "Project", project.Id` |
| `NetworkingService.RespondAsync` (accept) | `"CONNECTION_ACCEPTED", "Connection", id` (both users) |
| `NetworkingService` first accepted connection | `"FIRST_CONNECTION"` |
| `EventService.RegisterAsync` | `"EVENT_RSVP", "Event", eventId` |
| Event attendance confirmed | `"EVENT_ATTENDED", "Event", eventId` |
| Mentorship accepted | `"MENTORSHIP_ACCEPTED", "Mentorship", id` |
| Mentorship completed (worker) | `settings.MentorCompletionXp / MenteeCompletionXp` |

Milestone connection badges (10/25/50/75/100) are handled entirely by badge rules
(`ConnectionsAccepted` threshold), so no extra calls are needed.

## BadgeService (rule evaluation & unlock)

`EvaluateAsync` computes each active rule's current counter for the user and unlocks any
badge whose threshold is met and which isn't already owned. Unlock awards the badge's XP
reward through a dedicated `BADGE_<key>` idempotent transaction and sends a notification.

```csharp
public class BadgeService : IBadgeService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;
    public BadgeService(AppDbContext db, INotificationService notifications)
    { _db = db; _notifications = notifications; }

    public async Task<IReadOnlyList<BadgeDto>> EvaluateAsync(int userId, CancellationToken ct = default)
    {
        var defs = await _db.BadgeDefinitions.AsNoTracking().Where(d => d.IsActive).ToListAsync(ct);
        var owned = await _db.UserBadges.Where(ub => ub.UserId == userId)
            .Select(ub => ub.BadgeDefinitionId).ToListAsync(ct);

        // Counters computed once per evaluation.
        var counters = await BuildCountersAsync(userId, ct);
        var newly = new List<BadgeDefinition>();

        foreach (var d in defs.Where(d => !owned.Contains(d.Id)))
        {
            var current = counters.TryGetValue(d.RuleType, out var v) ? v : 0;
            if (current >= Math.Max(1, d.Threshold))
            {
                _db.UserBadges.Add(new UserBadge { UserId = userId, BadgeDefinitionId = d.Id });
                if (d.XpReward > 0)
                {
                    var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
                    if (profile is not null) profile.TotalXp += d.XpReward;
                    _db.XpTransactions.Add(new XpTransaction
                    {
                        UserId = userId, ActionKey = $"BADGE_{d.Key}", Points = d.XpReward,
                        ReferenceType = "Badge", ReferenceId = d.Id,
                        IdempotencyKey = $"BADGE:{d.Id}:{userId}", Note = $"Badge: {d.Title}"
                    });
                }
                newly.Add(d);
            }
        }

        if (newly.Count > 0)
        {
            await _db.SaveChangesAsync(ct);
            foreach (var d in newly)
                await _notifications.NotifyAsync(userId, $"🏅 Badge unlocked: {d.Title}", "/profile", ct);
        }
        return newly.Select(ToDto).ToList();
    }

    private async Task<Dictionary<BadgeRuleType, int>> BuildCountersAsync(int userId, CancellationToken ct)
    {
        var acceptedConnections = await _db.Connections.CountAsync(c =>
            c.Status == ConnectionStatus.Accepted &&
            (c.RequesterUserId == userId || c.AddresseeUserId == userId), ct);   // adjust to real column names
        var projects = await _db.Projects.CountAsync(p => p.Profile.UserId == userId, ct);
        var eventsAttended = await _db.EventRegistrations.CountAsync(r => r.UserId == userId, ct);
        var mentorshipsCompleted = await _db.Mentorships.CountAsync(m =>
            m.MentorUserId == userId && m.Status == MentorshipStatus.Completed, ct);
        var isMentor = await _db.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Mentor, ct);
        var totalXp = await _db.Profiles.Where(p => p.UserId == userId).Select(p => p.TotalXp).FirstOrDefaultAsync(ct);
        var profileComplete = await IsProfileCompleteAsync(userId, ct) ? 1 : 0;

        return new()
        {
            [BadgeRuleType.FirstLogin] = 1,   // granted on first authenticated call (see controller)
            [BadgeRuleType.ProfileCompleted] = profileComplete,
            [BadgeRuleType.FirstProject] = projects,
            [BadgeRuleType.ProjectsCompleted] = projects,
            [BadgeRuleType.FirstConnection] = acceptedConnections,
            [BadgeRuleType.ConnectionsAccepted] = acceptedConnections,
            [BadgeRuleType.FirstEventAttended] = eventsAttended,
            [BadgeRuleType.EventsAttended] = eventsAttended,
            [BadgeRuleType.BecameMentor] = isMentor ? 1 : 0,
            [BadgeRuleType.MentorshipsCompleted] = mentorshipsCompleted,
            [BadgeRuleType.XpThreshold] = totalXp,
            // Workshops/Hackathons: count EventRegistrations joined to an Event "category"
            // if/when events gain a type; until then these rules stay dormant (0).
        };
    }

    // A profile is "complete" when the professional essentials are present.
    private Task<bool> IsProfileCompleteAsync(int userId, CancellationToken ct) =>
        _db.Profiles.AnyAsync(p => p.UserId == userId
            && p.FullName != "" && p.Headline != null && p.Bio != null
            && p.Cohort != null && p.Programme != null
            && p.Skills.Count > 0, ct);

    public async Task<IReadOnlyList<BadgeDto>> GetForUserAsync(int userId, CancellationToken ct = default) =>
        await _db.UserBadges.AsNoTracking().Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.UnlockedAt)
            .Select(ub => new BadgeDto(ub.Badge.Key, ub.Badge.Title, ub.Badge.Description,
                ub.Badge.Icon, ub.Badge.Rarity.ToString(), ub.Badge.XpReward, ub.UnlockedAt))
            .ToListAsync(ct);

    private static BadgeDto ToDto(BadgeDefinition d) =>
        new(d.Key, d.Title, d.Description, d.Icon, d.Rarity.ToString(), d.XpReward, DateTime.UtcNow);
}
```

> Adjust the `Connections` column names (`RequesterUserId`/`AddresseeUserId`) to the real
> ones on your `Connection` entity — that's the only place this file assumes a shape it
> hasn't been shown.

## LeaderboardService (Top 10 + self-rank)

```csharp
public class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _me;
    public LeaderboardService(AppDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public async Task<LeaderboardDto> GetAsync(string scope, int top = 10, CancellationToken ct = default)
    {
        var role = scope == "Mentor" ? UserRole.Mentor : UserRole.Alumni;
        var q = _db.Profiles.AsNoTracking().Where(p => p.User.Role == role);

        var topRows = await q.OrderByDescending(p => p.TotalXp).ThenBy(p => p.FullName)
            .Take(top)
            .Select(p => new LeaderboardRowDto(p.UserId, p.FullName, p.AvatarUrl, p.TotalXp, 0))
            .ToListAsync(ct);
        for (int i = 0; i < topRows.Count; i++) topRows[i] = topRows[i] with { Rank = i + 1 };

        // Caller's own rank if outside the Top N.
        LeaderboardRowDto? self = null;
        var meId = _me.UserId;
        if (!topRows.Any(r => r.UserId == meId))
        {
            var mine = await q.Where(p => p.UserId == meId)
                .Select(p => new { p.UserId, p.FullName, p.AvatarUrl, p.TotalXp }).FirstOrDefaultAsync(ct);
            if (mine is not null)
            {
                var rank = await q.CountAsync(p => p.TotalXp > mine.TotalXp, ct) + 1;
                self = new LeaderboardRowDto(mine.UserId, mine.FullName, mine.AvatarUrl, mine.TotalXp, rank);
            }
        }
        return new LeaderboardDto(scope, topRows, self);
    }
}
```
