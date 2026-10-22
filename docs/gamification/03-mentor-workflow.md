# 03 — Mentor eligibility, application, capacity, duration & auto-completion

One service owns the mentor programme rules; a hosted `BackgroundService` closes engagements
when their duration elapses.

## Interface

```csharp
public interface IMentorProgramService
{
    Task<MentorEligibilityDto> GetEligibilityAsync(CancellationToken ct = default);   // caller
    Task<MentorApplicationDto> ApplyAsync(MentorApplyDto dto, CancellationToken ct = default);
    Task SetAvailabilityAsync(bool available, CancellationToken ct = default);         // mentor

    // Admin approval queue
    Task<IReadOnlyList<MentorApplicationDto>> ListApplicationsAsync(MentorApplicationStatus? status, CancellationToken ct = default);
    Task<MentorApplicationDto> ReviewAsync(int applicationId, ReviewMentorDto dto, CancellationToken ct = default);

    // Capacity check used by NetworkingService when accepting a mentorship request
    Task<(bool ok, string? reason)> CanAcceptMenteeAsync(int mentorUserId, CancellationToken ct = default);
    Task StartMentorshipAsync(int mentorUserId, int menteeUserId, int? connectionId, CancellationToken ct = default);
}
```

## Eligibility (configurable requirements → progress indicator)

```csharp
public async Task<MentorEligibilityDto> GetEligibilityAsync(CancellationToken ct = default)
{
    var userId = _me.UserId;
    var s = await _settings.GetAsync(ct);                       // RecognitionSettings singleton
    var user = await _db.Users.Include(u => u.Profile).FirstAsync(u => u.Id == userId, ct);
    var xp = user.Profile?.TotalXp ?? 0;
    var already = user.Role == UserRole.Mentor;
    var pending = await _db.MentorApplications.AnyAsync(a =>
        a.UserId == userId && a.Status == MentorApplicationStatus.Pending, ct);

    var reqs = new List<EligibilityRequirementDto>
    {
        new("Minimum XP", $"{xp} / {s.MentorMinXp} XP", xp >= s.MentorMinXp),
        new("Verified account", "Account approved by an administrator",
            !s.RequireVerifiedAccount || user.Status == AccountStatus.Approved),
        new("Complete professional profile", "Headline, bio, cohort, programme and skills",
            !s.RequireCompleteProfile || await _badgeService_IsProfileComplete(userId, ct)),
    };

    var eligible = !already && !pending && reqs.All(r => r.Met);
    return new MentorEligibilityDto(eligible, already, pending, reqs);
}
```

`ApplyAsync` re-checks eligibility server-side (never trust the client), then inserts a
`MentorApplication { Status = Pending }`. The Administrator Approval Queue lists these
alongside the existing account approvals.

`ReviewAsync` (admin): on **Approve** → set application `Approved`, promote
`user.Role = UserRole.Mentor`, set `profile.IsMentor = true`, `IsAvailableToMentor = true`,
award `"BECAME_MENTOR"` XP, evaluate badges (unlocks *Mentor Approved*), notify.
On **Reject / RequestInfo** → set status + `ReviewNote` + notify. RBAC: `[Authorize(Roles="Admin")]`.

## Availability toggle

```csharp
public async Task SetAvailabilityAsync(bool available, CancellationToken ct = default)
{
    var p = await _db.Profiles.FirstAsync(p => p.UserId == _me.UserId, ct);
    p.IsAvailableToMentor = available;           // hidden from matching when false
    await _db.SaveChangesAsync(ct);
}
```

Directory/networking mentor discovery should filter on
`IsMentor && IsAvailableToMentor && activeMentees < MaxActiveMentees` — add that predicate
to the existing `DirectoryService`/`NetworkingService.SuggestAsync` mentor filter (additive).

## Capacity (max 3) enforced at accept-time

In the existing `NetworkingService.RespondAsync`, when accepting a **Mentorship** request,
call the guard before saving:

```csharp
if (connection.Type == ConnectionType.Mentorship && accept)
{
    var (ok, reason) = await _mentorProgram.CanAcceptMenteeAsync(mentorUserId, ct);
    if (!ok) throw new ConflictAppException(reason!);   // e.g. "You are at full mentee capacity (3)."
}
// ...after save:
if (connection.Type == ConnectionType.Mentorship && accept)
    await _mentorProgram.StartMentorshipAsync(mentorUserId, menteeUserId, connection.Id, ct);
```

```csharp
public async Task<(bool ok, string? reason)> CanAcceptMenteeAsync(int mentorUserId, CancellationToken ct = default)
{
    var s = await _settings.GetAsync(ct);
    var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == mentorUserId, ct);
    if (profile is { IsAvailableToMentor: false })
        return (false, "You are currently unavailable to mentor. Enable availability to accept mentees.");
    var active = await _db.Mentorships.CountAsync(m =>
        m.MentorUserId == mentorUserId && m.Status == MentorshipStatus.Active, ct);
    return active >= s.MaxActiveMentees
        ? (false, $"You are at full mentee capacity ({s.MaxActiveMentees}).")
        : (true, null);
}

public async Task StartMentorshipAsync(int mentorUserId, int menteeUserId, int? connectionId, CancellationToken ct = default)
{
    var s = await _settings.GetAsync(ct);
    _db.Mentorships.Add(new Mentorship
    {
        MentorUserId = mentorUserId, MenteeUserId = menteeUserId, ConnectionId = connectionId,
        StartedAt = DateTime.UtcNow, DueAt = DateTime.UtcNow.AddDays(s.MentorshipDurationDays),
        Status = MentorshipStatus.Active
    });
    await _db.SaveChangesAsync(ct);
    await _xp.AwardAsync(mentorUserId, "MENTORSHIP_ACCEPTED", "Mentorship", connectionId);
}
```

The UI shows "At full capacity (3/3)" using the same counter (exposed via the eligibility /
mentor-dashboard endpoints).

## Auto-completion background worker

```csharp
// Infrastructure/Workers/MentorshipCompletionWorker.cs
public class MentorshipCompletionWorker : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<MentorshipCompletionWorker> _log;
    public MentorshipCompletionWorker(IServiceProvider sp, ILogger<MentorshipCompletionWorker> log)
    { _sp = sp; _log = log; }

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        while (!stop.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var xp = scope.ServiceProvider.GetRequiredService<IXpService>();
                var notify = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var settings = await scope.ServiceProvider.GetRequiredService<IRecognitionSettingsProvider>().GetAsync(stop);

                var due = await db.Mentorships
                    .Where(m => m.Status == MentorshipStatus.Active && m.DueAt <= DateTime.UtcNow)
                    .ToListAsync(stop);

                foreach (var m in due)
                {
                    m.Status = MentorshipStatus.Completed;
                    m.CompletedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync(stop);
                    await xp.AwardAsync(m.MentorUserId, "MENTORSHIP_COMPLETED_MENTOR", "Mentorship", m.Id);
                    await xp.AwardAsync(m.MenteeUserId, "MENTORSHIP_COMPLETED_MENTEE", "Mentorship", m.Id);
                    await notify.NotifyAsync(m.MentorUserId, "🎓 A mentorship cycle completed — XP awarded!", "/dashboard", stop);
                    await notify.NotifyAsync(m.MenteeUserId, "🎓 Your mentorship completed — XP awarded!", "/dashboard", stop);
                }
            }
            catch (Exception ex) { _log.LogError(ex, "Mentorship completion sweep failed"); }

            await Task.Delay(TimeSpan.FromHours(1), stop);   // hourly sweep
        }
    }
}
```

Register in `Program.cs`: `builder.Services.AddHostedService<MentorshipCompletionWorker>();`
(`MENTORSHIP_COMPLETED_MENTOR/MENTEE` XP values come from the seeded XP config, and the
`RecognitionSettings.MentorCompletionXp/MenteeCompletionXp` mirror them for quick tuning).
