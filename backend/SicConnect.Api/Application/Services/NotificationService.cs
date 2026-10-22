using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>In-app notifications for the authenticated user.</summary>
public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext db, ICurrentUser currentUser, ILogger<NotificationService> logger)
    {
        _db = db;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<IReadOnlyList<NotificationDto>> ListMineAsync(CancellationToken ct = default)
    {
        return await _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == _currentUser.UserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new NotificationDto(n.Id, n.Message, n.Link, n.IsRead, n.CreatedAt))
            .ToListAsync(ct);
    }

    public Task<int> UnreadCountAsync(CancellationToken ct = default) =>
        _db.Notifications.CountAsync(n => n.UserId == _currentUser.UserId && !n.IsRead, ct);

    public async Task MarkReadAsync(int id, CancellationToken ct = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == _currentUser.UserId, ct)
            ?? throw new NotFoundAppException("Notification not found.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task MarkAllReadAsync(CancellationToken ct = default)
    {
        await _db.Notifications
            .Where(n => n.UserId == _currentUser.UserId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }

    public async Task NotifyAsync(int userId, string message, string? link = null, CancellationToken ct = default)
    {
        try
        {
            _db.Notifications.Add(new Notification { UserId = userId, Message = message, Link = link });
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // Notifications are best-effort — never fail the triggering action because of one.
            _logger.LogWarning(ex, "Failed to create notification for user {UserId}", userId);
        }
    }
}
