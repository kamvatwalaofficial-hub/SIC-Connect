using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>Reads and updates the authenticated user's own profile, skills and certifications.</summary>
public class ProfileService : IProfileService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public ProfileService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ProfileDto> GetMineAsync(CancellationToken ct = default)
    {
        var (user, profile) = await LoadAsync(ct);
        return profile.ToDto(user);
    }

    public async Task<ProfileDto> UpdateMineAsync(UpdateProfileDto dto, CancellationToken ct = default)
    {
        var (user, profile) = await LoadAsync(ct);

        profile.FullName = dto.FullName.Trim();
        profile.Cohort = Clean(dto.Cohort);
        profile.Location = Clean(dto.Location);
        profile.Industry = Clean(dto.Industry);
        profile.EmploymentStatus = dto.EmploymentStatus;
        profile.Bio = Clean(dto.Bio);
        profile.Headline = Clean(dto.Headline);
        profile.AvatarUrl = Clean(dto.AvatarUrl);
        profile.LinkedInUrl = Clean(dto.LinkedInUrl);
        profile.GitHubUrl = Clean(dto.GitHubUrl);
        profile.CvUrl = Clean(dto.CvUrl);
        profile.IsMentor = dto.IsMentor;
        profile.UpdatedAt = DateTime.UtcNow;

        if (dto.Skills is not null)
        {
            _db.Skills.RemoveRange(profile.Skills);
            profile.Skills = dto.Skills
                .Where(s => !string.IsNullOrWhiteSpace(s.Name))
                .Select(s => new Skill { Name = s.Name.Trim(), Level = Clean(s.Level) })
                .ToList();
        }

        if (dto.Certifications is not null)
        {
            _db.Certifications.RemoveRange(profile.Certifications);
            profile.Certifications = dto.Certifications
                .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                .Select(c => new Certification
                {
                    Name = c.Name.Trim(),
                    Issuer = Clean(c.Issuer),
                    IssuedOn = c.IssuedOn,
                    CredentialUrl = Clean(c.CredentialUrl)
                })
                .ToList();
        }

        await _db.SaveChangesAsync(ct);
        return profile.ToDto(user);
    }

    private async Task<(User user, AlumniProfile profile)> LoadAsync(CancellationToken ct)
    {
        var user = await _db.Users
            .Include(u => u.Profile).ThenInclude(p => p!.Skills)
            .Include(u => u.Profile).ThenInclude(p => p!.Certifications)
            .Include(u => u.Profile).ThenInclude(p => p!.Projects)
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, ct)
            ?? throw new NotFoundAppException("User not found.");

        if (user.Profile is null)
            throw new NotFoundAppException("Profile not found.");

        return (user, user.Profile);
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
