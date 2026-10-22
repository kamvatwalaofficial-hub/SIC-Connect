using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// AI-powered opportunity recommendations — a transparent, explainable heuristic
/// (prototype logic, not an external model). Each opportunity is scored against the caller's
/// profile and returned with the reasons behind its ranking.
/// </summary>
public class RecommendationService : IRecommendationService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public RecommendationService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<OpportunityRecommendationDto>> RecommendOpportunitiesAsync(int take = 6, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;

        var profile = await _db.Profiles.AsNoTracking()
            .Include(p => p.Skills)
            .FirstOrDefaultAsync(p => p.UserId == me, ct);

        var opportunities = await _db.Opportunities.AsNoTracking().ToListAsync(ct);
        if (opportunities.Count == 0) return Array.Empty<OpportunityRecommendationDto>();

        // Opportunities the user already applied to are excluded from recommendations.
        var appliedIds = (await _db.OpportunityApplications.AsNoTracking()
            .Where(a => a.UserId == me)
            .Select(a => a.OpportunityId)
            .ToListAsync(ct)).ToHashSet();

        var skills = profile?.Skills.Select(s => s.Name.Trim()).Where(s => s.Length > 0).Distinct().ToList()
                     ?? new List<string>();
        var industry = profile?.Industry;
        var status = profile?.EmploymentStatus ?? EmploymentStatus.Unspecified;
        var seeking = status is EmploymentStatus.SeekingWork or EmploymentStatus.Student or EmploymentStatus.Internship;

        var results = new List<OpportunityRecommendationDto>();
        foreach (var o in opportunities)
        {
            if (appliedIds.Contains(o.Id)) continue;

            var haystack = $"{o.Title} {o.Description} {o.Organisation}".ToLowerInvariant();
            var reasons = new List<string>();
            var score = 0;

            var matchedSkills = skills.Where(s => haystack.Contains(s.ToLowerInvariant())).ToList();
            if (matchedSkills.Count > 0)
            {
                score += matchedSkills.Count * 4;
                reasons.Add($"Matches your skills: {string.Join(", ", matchedSkills.Take(3))}");
            }

            if (!string.IsNullOrWhiteSpace(industry) && haystack.Contains(industry!.ToLowerInvariant()))
            {
                score += 3;
                reasons.Add($"In your industry ({industry})");
            }

            if (seeking && o.Type is OpportunityType.Job or OpportunityType.Internship or OpportunityType.GraduateProgramme)
            {
                score += 2;
                reasons.Add("Fits your current job search");
            }

            if (profile?.IsMentor == true && o.IsMentorshipTagged)
            {
                score += 2;
                reasons.Add("Flagged for mentors");
            }

            if (o.Deadline.HasValue && o.Deadline.Value >= DateTime.UtcNow &&
                o.Deadline.Value <= DateTime.UtcNow.AddDays(30))
            {
                score += 1;
                reasons.Add("Closing soon");
            }

            if (o.CreatedAt >= DateTime.UtcNow.AddDays(-14))
            {
                score += 1;
                reasons.Add("Recently posted");
            }

            if (score <= 0) continue;

            results.Add(new OpportunityRecommendationDto(o.ToDto(), score, reasons));
        }

        return results
            .OrderByDescending(r => r.Score)
            .ThenByDescending(r => r.Opportunity.CreatedAt)
            .Take(take)
            .ToList();
    }
}
