using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>Manages the authenticated user's showcase projects.</summary>
public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public ProjectService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<ProjectDto>> ListMineAsync(CancellationToken ct = default)
    {
        var profileId = await GetProfileIdAsync(ct);
        return await _db.Projects
            .AsNoTracking()
            .Where(p => p.ProfileId == profileId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => p.ToDto())
            .ToListAsync(ct);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, CancellationToken ct = default)
    {
        var profileId = await GetProfileIdAsync(ct);
        var project = new Project
        {
            ProfileId = profileId,
            Title = dto.Title.Trim(),
            Summary = dto.Summary?.Trim(),
            TechStack = dto.TechStack?.Trim(),
            GitHubUrl = dto.GitHubUrl?.Trim(),
            DemoUrl = dto.DemoUrl?.Trim(),
            Achievements = dto.Achievements?.Trim()
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync(ct);
        return project.ToDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var profileId = await GetProfileIdAsync(ct);
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundAppException($"Project {id} not found.");

        if (project.ProfileId != profileId)
            throw new ForbiddenAppException("You can only delete your own projects.");

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<int> GetProfileIdAsync(CancellationToken ct)
    {
        var profileId = await _db.Profiles
            .Where(p => p.UserId == _currentUser.UserId)
            .Select(p => (int?)p.Id)
            .FirstOrDefaultAsync(ct);

        return profileId ?? throw new NotFoundAppException("Profile not found.");
    }
}
