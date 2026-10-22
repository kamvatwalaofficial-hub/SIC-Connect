using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Mentor eligibility: computes whether the current alumnus qualifies to apply to become a
/// mentor. Eligibility requires reaching the recognition-XP threshold and having a reasonably
/// complete professional profile. Read-only and schema-free — it reuses existing profile data
/// and the shared <see cref="RecognitionScoring"/> weighting.
/// </summary>
public class MentorService : IMentorService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _current;

    public MentorService(AppDbContext db, ICurrentUser current)
    {
        _db = db;
        _current = current;
    }

    public async Task<MentorEligibilityDto> GetEligibilityAsync(CancellationToken ct = default)
    {
        var userId = _current.UserId;

        var data = await _db.Profiles
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new
            {
                p.User.Role,
                p.IsMentor,
                HasHeadline = p.Headline != null && p.Headline != "",
                HasBio = p.Bio != null && p.Bio != "",
                Skills = p.Skills.Count,
                Certifications = p.Certifications.Count,
                Projects = p.Projects.Count,
                Connections = _db.Connections.Count(c =>
                    c.Status == ConnectionStatus.Accepted &&
                    (c.RequesterId == p.UserId || c.AddresseeId == p.UserId)),
                Events = _db.EventRegistrations.Count(r => r.UserId == p.UserId),
            })
            .FirstOrDefaultAsync(ct);

        var required = RecognitionScoring.MentorXpThreshold;

        // No profile row (shouldn't happen for an authenticated alumnus) — treat as not eligible.
        if (data is null)
            return new MentorEligibilityDto(0, required, false, false, false, new[] { "Complete your profile." });

        var alreadyMentor = data.Role == UserRole.Mentor || data.IsMentor;
        var xp = RecognitionScoring.Score(data.Skills, data.Certifications, data.Projects, data.Connections, data.Events);

        // "Complete profile" = a headline, a bio and at least three skills.
        var profileComplete = data.HasHeadline && data.HasBio && data.Skills >= 3;

        var unmet = new List<string>();
        if (xp < required) unmet.Add($"Earn {required - xp} more XP (recognition points).");
        if (!data.HasHeadline) unmet.Add("Add a professional headline.");
        if (!data.HasBio) unmet.Add("Add a short bio.");
        if (data.Skills < 3) unmet.Add($"List at least 3 skills (you have {data.Skills}).");

        var isEligible = !alreadyMentor && xp >= required && profileComplete;

        return new MentorEligibilityDto(xp, required, profileComplete, alreadyMentor, isEligible, unmet);
    }

    public async Task<MentorApplyResultDto> ApplyAsync(CancellationToken ct = default)
    {
        var eligibility = await GetEligibilityAsync(ct);

        if (eligibility.AlreadyMentor)
            throw new ConflictAppException("You are already a mentor.");
        if (!eligibility.IsEligible)
            throw new ValidationAppException("You do not yet meet the mentor eligibility requirements.");

        var applicant = await _db.Profiles
            .AsNoTracking()
            .Where(p => p.UserId == _current.UserId)
            .Select(p => p.FullName)
            .FirstOrDefaultAsync(ct) ?? _current.Email ?? "An alumnus";

        // Notify every administrator so they can review and promote via the Users console.
        // Uses the existing notification infrastructure — no new tables required.
        var adminIds = await _db.Users
            .Where(u => u.Role == UserRole.Admin)
            .Select(u => u.Id)
            .ToListAsync(ct);

        foreach (var adminId in adminIds)
        {
            AddAdminNotification(adminId, $"{applicant} has applied to become a mentor ({eligibility.Xp} XP). Review in the Users console.");
        }

        if (adminIds.Count > 0)
            await _db.SaveChangesAsync(ct);

        return new MentorApplyResultDto(
            "Your mentor application has been submitted. An administrator will review it shortly.");
    }

    private void AddAdminNotification(int userId, string message) =>
        _db.Notifications.Add(new Notification { UserId = userId, Message = message, Link = "/admin/users" });
}
