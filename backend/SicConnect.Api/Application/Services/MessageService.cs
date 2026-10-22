using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Direct messaging between connected users. A message may only be sent between two users who
/// share an <see cref="ConnectionStatus.Accepted"/> connection or mentorship — enforced here,
/// independently of the UI.
/// </summary>
public class MessageService : IMessageService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notifications;

    public MessageService(AppDbContext db, ICurrentUser currentUser, INotificationService notifications)
    {
        _db = db;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<IReadOnlyList<ConversationDto>> GetConversationsAsync(CancellationToken ct = default)
    {
        var me = _currentUser.UserId;

        var connectedIds = await _db.Connections.AsNoTracking()
            .Where(c => c.Status == ConnectionStatus.Accepted && (c.RequesterId == me || c.AddresseeId == me))
            .Select(c => c.RequesterId == me ? c.AddresseeId : c.RequesterId)
            .ToListAsync(ct);

        var messages = await _db.Messages.AsNoTracking()
            .Where(m => m.SenderId == me || m.RecipientId == me)
            .Select(m => new { m.SenderId, m.RecipientId, m.Body, m.SentAt, m.ReadAt })
            .ToListAsync(ct);

        var partnerIds = messages.Select(m => m.SenderId == me ? m.RecipientId : m.SenderId);
        var allIds = connectedIds.Concat(partnerIds).Where(id => id != me).Distinct().ToList();
        if (allIds.Count == 0) return Array.Empty<ConversationDto>();

        var people = await _db.Profiles.AsNoTracking()
            .Where(p => allIds.Contains(p.UserId))
            .Select(p => new { p.UserId, p.FullName, p.Headline })
            .ToListAsync(ct);
        var connectedSet = connectedIds.ToHashSet();

        var conversations = allIds.Select(id =>
        {
            var thread = messages.Where(m => (m.SenderId == id || m.RecipientId == id)).ToList();
            var last = thread.OrderByDescending(m => m.SentAt).FirstOrDefault();
            var unread = thread.Count(m => m.RecipientId == me && m.ReadAt == null);
            var person = people.FirstOrDefault(p => p.UserId == id);
            return new ConversationDto(
                id,
                person?.FullName ?? "SIC member",
                person?.Headline,
                last?.Body,
                last?.SentAt,
                unread,
                connectedSet.Contains(id));
        });

        return conversations
            .OrderByDescending(c => c.LastAt ?? DateTime.MinValue)
            .ThenBy(c => c.OtherName)
            .ToList();
    }

    public async Task<ThreadDto> GetThreadAsync(int otherUserId, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;
        var other = await _db.Profiles.AsNoTracking()
            .Where(p => p.UserId == otherUserId)
            .Select(p => new { p.FullName, p.Headline })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundAppException("User not found.");

        // Mark incoming messages from this person as read.
        await _db.Messages
            .Where(m => m.SenderId == otherUserId && m.RecipientId == me && m.ReadAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReadAt, DateTime.UtcNow), ct);

        var messages = await _db.Messages.AsNoTracking()
            .Where(m => (m.SenderId == me && m.RecipientId == otherUserId)
                     || (m.SenderId == otherUserId && m.RecipientId == me))
            .OrderBy(m => m.SentAt)
            .Select(m => new MessageDto(m.Id, m.SenderId, m.SenderId == me, m.Body, m.SentAt, m.ReadAt))
            .ToListAsync(ct);

        return new ThreadDto(otherUserId, other.FullName, other.Headline, await AreConnectedAsync(me, otherUserId, ct), messages);
    }

    public async Task<MessageDto> SendAsync(int otherUserId, SendMessageDto dto, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;
        if (otherUserId == me)
            throw new ValidationAppException("You cannot message yourself.");

        var otherExists = await _db.Users.AnyAsync(u => u.Id == otherUserId, ct);
        if (!otherExists) throw new NotFoundAppException("User not found.");

        if (!await AreConnectedAsync(me, otherUserId, ct))
            throw new ForbiddenAppException("You can only message people you're connected with.");

        var message = new Message
        {
            SenderId = me,
            RecipientId = otherUserId,
            Body = dto.Body.Trim()
        };
        _db.Messages.Add(message);
        await _db.SaveChangesAsync(ct);

        var myName = await _db.Profiles.AsNoTracking()
            .Where(p => p.UserId == me).Select(p => p.FullName).FirstOrDefaultAsync(ct);
        await _notifications.NotifyAsync(otherUserId, $"New message from {myName ?? "a connection"}.", "/messages", ct);

        return new MessageDto(message.Id, me, true, message.Body, message.SentAt, message.ReadAt);
    }

    public Task<int> UnreadCountAsync(CancellationToken ct = default) =>
        _db.Messages.CountAsync(m => m.RecipientId == _currentUser.UserId && m.ReadAt == null, ct);

    private Task<bool> AreConnectedAsync(int a, int b, CancellationToken ct) =>
        _db.Connections.AnyAsync(c => c.Status == ConnectionStatus.Accepted
            && ((c.RequesterId == a && c.AddresseeId == b) || (c.RequesterId == b && c.AddresseeId == a)), ct);
}
