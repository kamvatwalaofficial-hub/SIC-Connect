# 04 — DTOs, Controllers, RBAC & DI registration

## DTOs — `Application/Dtos/RecognitionDtos.cs`

```csharp
namespace SicConnect.Api.Application.Dtos;

// XP
public record XpAwardResult(int PointsAwarded, int NewTotal, IReadOnlyList<BadgeDto> UnlockedBadges);
public record XpTransactionDto(string ActionKey, string? Note, int Points, DateTime CreatedAt);
public record XpActionConfigDto(int Id, string ActionKey, string DisplayName, string? Description, int Points, bool IsRepeatable, bool IsActive);
public record UpsertXpActionConfigDto(string ActionKey, string DisplayName, string? Description, int Points, bool IsRepeatable, bool IsActive);

// Badges
public record BadgeDto(string Key, string Title, string Description, string Icon, string Rarity, int XpReward, DateTime UnlockedAt);
public record BadgeDefinitionDto(int Id, string Key, string Title, string Description, string Icon, string Rarity, string RuleType, int Threshold, int XpReward, bool IsActive, int SortOrder);
public record UpsertBadgeDto(string Key, string Title, string Description, string Icon, string Rarity, string RuleType, int Threshold, int XpReward, bool IsActive, int SortOrder);

// Leaderboard
public record LeaderboardRowDto(int UserId, string FullName, string? AvatarUrl, int TotalXp, int Rank);
public record LeaderboardDto(string Scope, IReadOnlyList<LeaderboardRowDto> Top, LeaderboardRowDto? Self);

// Recognition summary for the current user (dashboard header + profile)
public record MyRecognitionDto(int TotalXp, int Rank, string Scope, IReadOnlyList<BadgeDto> Badges, int NextBadgeProgressPct, string? NextBadgeTitle);

// Celebrations (server-driven modals)
public record CelebrationDto(string Type /* "Badge" | "Xp" */, string Title, string? Description, string? Icon, string? Rarity, int? Xp, int Id);

// Mentor programme
public record EligibilityRequirementDto(string Label, string Detail, bool Met);
public record MentorEligibilityDto(bool Eligible, bool AlreadyMentor, bool ApplicationPending, IReadOnlyList<EligibilityRequirementDto> Requirements);
public record MentorApplyDto(string? Motivation);
public record MentorApplicationDto(int Id, int UserId, string ApplicantName, string Status, string? Motivation, int XpAtApply, DateTime SubmittedAt, string? ReviewNote);
public record ReviewMentorDto(string Decision /* Approve | Reject | RequestInfo */, string? Note);
public record MentorCapacityDto(int ActiveMentees, int MaxMentees, bool Available);

// Settings
public record RecognitionSettingsDto(int MentorMinXp, bool RequireVerifiedAccount, bool RequireCompleteProfile, int MaxActiveMentees, int MentorshipDurationDays, int MentorCompletionXp, int MenteeCompletionXp);

// Skills catalogue
public record SkillCatalogItemDto(int Id, string Name, string? Category, bool IsActive);

// Admin analytics
public record RecognitionAnalyticsDto(
    int TotalXpAwarded, int BadgesUnlocked, int ActiveMentorships, int CompletedMentorships,
    double MentorshipCompletionRate,
    IReadOnlyList<LeaderboardRowDto> MostActive,
    IReadOnlyList<CountByLabelDto> MostEarnedBadges,
    IReadOnlyList<CountByLabelDto> XpByMonth);
```

## Controllers — `Controllers/`

```csharp
// RecognitionController.cs — member-facing reads (Alumni, Mentor, Admin may all read).
[ApiController, Authorize, Route("api/recognition")]
public class RecognitionController : ControllerBase
{
    private readonly IXpService _xp;
    private readonly IBadgeService _badges;
    private readonly ILeaderboardService _board;
    private readonly IRecognitionService _me;   // aggregates "my recognition" + celebrations
    // ctor omitted

    [HttpGet("me")]                    // total XP, rank, badges, next-badge progress
    public async Task<ActionResult<MyRecognitionDto>> Me(CancellationToken ct) => Ok(await _me.GetMineAsync(ct));

    [HttpGet("leaderboard")]           // ?scope=Alumni|Mentor
    public async Task<ActionResult<LeaderboardDto>> Leaderboard([FromQuery] string scope = "Alumni", CancellationToken ct = default)
        => Ok(await _board.GetAsync(scope, 10, ct));

    [HttpGet("badges")]
    public async Task<ActionResult<IReadOnlyList<BadgeDto>>> Badges(CancellationToken ct) => Ok(await _badges.GetForUserAsync(User.UserId(), ct));

    [HttpGet("xp-history")]
    public async Task<ActionResult<IReadOnlyList<XpTransactionDto>>> History(CancellationToken ct) => Ok(await _xp.GetHistoryAsync(User.UserId(), 50, ct));

    [HttpGet("celebrations")]          // unseen badge/xp events → drive CelebrationModal
    public async Task<ActionResult<IReadOnlyList<CelebrationDto>>> Celebrations(CancellationToken ct) => Ok(await _me.GetPendingCelebrationsAsync(ct));

    [HttpPost("celebrations/seen")]    // mark shown so modals don't repeat
    public async Task<IActionResult> MarkSeen([FromBody] int[] ids, CancellationToken ct) { await _me.MarkCelebratedAsync(ids, ct); return NoContent(); }
}

// MentorProgramController.cs — eligibility/application/availability (member) + queue (admin).
[ApiController, Authorize, Route("api/mentor-program")]
public class MentorProgramController : ControllerBase
{
    private readonly IMentorProgramService _svc;   // ctor omitted

    [HttpGet("eligibility")]
    public async Task<ActionResult<MentorEligibilityDto>> Eligibility(CancellationToken ct) => Ok(await _svc.GetEligibilityAsync(ct));

    [Authorize(Roles = "Alumni")]
    [HttpPost("apply")]
    public async Task<ActionResult<MentorApplicationDto>> Apply(MentorApplyDto dto, CancellationToken ct) => Ok(await _svc.ApplyAsync(dto, ct));

    [Authorize(Roles = "Mentor")]
    [HttpPut("availability")]
    public async Task<IActionResult> Availability([FromBody] bool available, CancellationToken ct) { await _svc.SetAvailabilityAsync(available, ct); return NoContent(); }

    [Authorize(Roles = "Admin")]
    [HttpGet("applications")]          // approval queue
    public async Task<ActionResult<IReadOnlyList<MentorApplicationDto>>> Applications([FromQuery] MentorApplicationStatus? status, CancellationToken ct)
        => Ok(await _svc.ListApplicationsAsync(status, ct));

    [Authorize(Roles = "Admin")]
    [HttpPost("applications/{id:int}/review")]
    public async Task<ActionResult<MentorApplicationDto>> Review(int id, ReviewMentorDto dto, CancellationToken ct) => Ok(await _svc.ReviewAsync(id, dto, ct));
}

// AdminRecognitionController.cs — configuration + analytics (Admin only).
[ApiController, Authorize(Roles = "Admin"), Route("api/admin/recognition")]
public class AdminRecognitionController : ControllerBase
{
    private readonly IRecognitionAdminService _admin;   // ctor omitted

    [HttpGet("analytics")] public async Task<ActionResult<RecognitionAnalyticsDto>> Analytics(CancellationToken ct) => Ok(await _admin.GetAnalyticsAsync(ct));

    [HttpGet("xp-config")]  public async Task<ActionResult<IReadOnlyList<XpActionConfigDto>>> XpConfig(CancellationToken ct) => Ok(await _admin.ListXpAsync(ct));
    [HttpPut("xp-config/{id:int}")] public async Task<ActionResult<XpActionConfigDto>> UpdateXp(int id, UpsertXpActionConfigDto dto, CancellationToken ct) => Ok(await _admin.UpsertXpAsync(id, dto, ct));

    [HttpGet("badges")] public async Task<ActionResult<IReadOnlyList<BadgeDefinitionDto>>> Badges(CancellationToken ct) => Ok(await _admin.ListBadgesAsync(ct));
    [HttpPost("badges")] public async Task<ActionResult<BadgeDefinitionDto>> CreateBadge(UpsertBadgeDto dto, CancellationToken ct) => Ok(await _admin.UpsertBadgeAsync(null, dto, ct));
    [HttpPut("badges/{id:int}")] public async Task<ActionResult<BadgeDefinitionDto>> UpdateBadge(int id, UpsertBadgeDto dto, CancellationToken ct) => Ok(await _admin.UpsertBadgeAsync(id, dto, ct));

    [HttpGet("settings")] public async Task<ActionResult<RecognitionSettingsDto>> Settings(CancellationToken ct) => Ok(await _admin.GetSettingsAsync(ct));
    [HttpPut("settings")] public async Task<ActionResult<RecognitionSettingsDto>> UpdateSettings(RecognitionSettingsDto dto, CancellationToken ct) => Ok(await _admin.UpdateSettingsAsync(dto, ct));

    [HttpGet("skills")] public async Task<ActionResult<IReadOnlyList<SkillCatalogItemDto>>> Skills(CancellationToken ct) => Ok(await _admin.ListSkillsAsync(ct));
    [HttpPost("skills")] public async Task<ActionResult<SkillCatalogItemDto>> AddSkill(SkillCatalogItemDto dto, CancellationToken ct) => Ok(await _admin.AddSkillAsync(dto, ct));

    [HttpGet("users/{userId:int}/xp-history")] public async Task<ActionResult<IReadOnlyList<XpTransactionDto>>> UserXp(int userId, CancellationToken ct) => Ok(await _admin.UserHistoryAsync(userId, ct));
}
```

> `User.UserId()` is a small `ClaimsPrincipal` extension you already use via `ICurrentUser`;
> reuse `ICurrentUser` by injecting it instead if you prefer (matches existing controllers).

A public **skills catalogue** read for the profile multi-select:
`[HttpGet("api/skills")] → ListSkillsAsync()` (anonymous-authenticated, all roles) so the
front end can replace its local `skillsCatalog.js` with the API list when ready.

Also add `GET /api/profiles/{userId:int}` (public professional profile, authenticated) so the
directory/community/connections "open profile" + LinkedIn/GitHub buttons work — project the
existing `ProfileDto` plus `Badges`. Add `LinkedInUrl`/`GitHubUrl` to `DirectoryItemDto` and
its projection so list cards can show the social buttons without a second request.

## DI registration — `Extensions/ServiceCollectionExtensions.cs → AddApplicationServices`

```csharp
services.AddScoped<IXpService, XpService>();
services.AddScoped<IBadgeService, BadgeService>();
services.AddScoped<ILeaderboardService, LeaderboardService>();
services.AddScoped<IRecognitionService, RecognitionService>();
services.AddScoped<IRecognitionAdminService, RecognitionAdminService>();
services.AddScoped<IMentorProgramService, MentorProgramService>();
services.AddScoped<IRecognitionSettingsProvider, RecognitionSettingsProvider>(); // caches the singleton row
```

And in `Program.cs`: `builder.Services.AddHostedService<MentorshipCompletionWorker>();`

## `DeleteUserAsync` cleanup (FK Restrict)

Extend the existing `AdminService.DeleteUserAsync` to first remove the user's
`XpTransactions`, `UserBadges`, `MentorApplications`, and `Mentorships`
(`RemoveRange`) before deleting the user, mirroring how event registrations are handled.
