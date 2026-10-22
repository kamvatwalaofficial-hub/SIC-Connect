using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>Reads announcements for all alumni; broadcasting/deleting is admin-only.</summary>
public class AnnouncementService : IAnnouncementService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public AnnouncementService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<AnnouncementDto>> ListAsync(CancellationToken ct = default)
    {
        return await _db.Announcements
            .AsNoTracking()
            .OrderByDescending(a => a.PublishedAt)
            .Select(a => a.ToDto())
            .ToListAsync(ct);
    }

    public async Task<AnnouncementDto> CreateAsync(CreateAnnouncementDto dto, CancellationToken ct = default)
    {
        var announcement = new Announcement
        {
            Title = dto.Title.Trim(),
            Body = dto.Body.Trim(),
            Audience = string.IsNullOrWhiteSpace(dto.Audience) ? "All" : dto.Audience.Trim(),
            PublishedByAdminId = _currentUser.UserId
        };

        _db.Announcements.Add(announcement);
        await _db.SaveChangesAsync(ct);
        return announcement.ToDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var announcement = await _db.Announcements.FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundAppException($"Announcement {id} not found.");

        _db.Announcements.Remove(announcement);
        await _db.SaveChangesAsync(ct);
    }
}
