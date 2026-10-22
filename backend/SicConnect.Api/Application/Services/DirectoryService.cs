using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Community directory search. Builds a filtered, paged LINQ query that EF Core
/// translates to parameterised T-SQL.
/// </summary>
public class DirectoryService : IDirectoryService
{
    private readonly AppDbContext _db;

    public DirectoryService(AppDbContext db) => _db = db;

    public async Task<PagedResult<DirectoryItemDto>> SearchAsync(DirectoryQueryDto query, CancellationToken ct = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;

        var q = _db.Profiles
            .AsNoTracking()
            .Include(p => p.Skills)
            .Include(p => p.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Cohort))
            q = q.Where(p => p.Cohort == query.Cohort);

        if (!string.IsNullOrWhiteSpace(query.Location))
            q = q.Where(p => p.Location != null && p.Location.Contains(query.Location));

        if (!string.IsNullOrWhiteSpace(query.Industry))
            q = q.Where(p => p.Industry != null && p.Industry.Contains(query.Industry));

        if (query.EmploymentStatus.HasValue)
            q = q.Where(p => p.EmploymentStatus == query.EmploymentStatus.Value);

        if (query.MentorsOnly == true)
            q = q.Where(p => p.IsMentor);

        if (!string.IsNullOrWhiteSpace(query.Skill))
            q = q.Where(p => p.Skills.Any(s => s.Name.Contains(query.Skill)));

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = query.Q.Trim();
            q = q.Where(p =>
                p.FullName.Contains(term) ||
                (p.Headline != null && p.Headline.Contains(term)) ||
                (p.Bio != null && p.Bio.Contains(term)) ||
                p.Skills.Any(s => s.Name.Contains(term)));
        }

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(p => p.IsMentor)
            .ThenBy(p => p.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new DirectoryItemDto(
                p.UserId,
                p.FullName,
                p.Cohort,
                p.Location,
                p.Industry,
                p.EmploymentStatus,
                p.Headline,
                p.AvatarUrl,
                p.IsMentor,
                p.Skills.Select(s => s.Name).ToList(),
                p.LinkedInUrl,
                p.GitHubUrl))
            .ToListAsync(ct);

        return new PagedResult<DirectoryItemDto>(items, page, pageSize, total);
    }
}
