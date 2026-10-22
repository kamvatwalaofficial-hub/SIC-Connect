using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Browsing/creating events and registering to attend. The <c>IsRegistered</c> flag on
/// each DTO reflects the current caller.
/// </summary>
public class EventService : IEventService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public EventService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<EventDto>> ListAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        return await _db.Events
            .AsNoTracking()
            .OrderBy(e => e.StartsAt)
            .Select(e => new EventDto(
                e.Id, e.Title, e.Description, e.StartsAt, e.EndsAt, e.Venue, e.IsOnline, e.Capacity,
                e.Registrations.Count,
                e.Registrations.Any(r => r.UserId == userId),
                e.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<EventDto> GetAsync(int id, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        var dto = await _db.Events
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new EventDto(
                e.Id, e.Title, e.Description, e.StartsAt, e.EndsAt, e.Venue, e.IsOnline, e.Capacity,
                e.Registrations.Count,
                e.Registrations.Any(r => r.UserId == userId),
                e.CreatedAt))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundAppException($"Event {id} not found.");
        return dto;
    }

    public async Task<EventDto> CreateAsync(CreateEventDto dto, CancellationToken ct = default)
    {
        if (dto.EndsAt.HasValue && dto.EndsAt.Value < dto.StartsAt)
            throw new ValidationAppException("Event end time cannot be before the start time.");

        var ev = new Event
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            StartsAt = dto.StartsAt,
            EndsAt = dto.EndsAt,
            Venue = dto.Venue?.Trim(),
            IsOnline = dto.IsOnline,
            Capacity = dto.Capacity,
            CreatedByAdminId = _currentUser.UserId
        };

        _db.Events.Add(ev);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(ev.Id, ct);
    }

    public async Task<EventDto> UpdateAsync(int id, CreateEventDto dto, CancellationToken ct = default)
    {
        if (dto.EndsAt.HasValue && dto.EndsAt.Value < dto.StartsAt)
            throw new ValidationAppException("Event end time cannot be before the start time.");

        var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new NotFoundAppException($"Event {id} not found.");

        ev.Title = dto.Title.Trim();
        ev.Description = dto.Description?.Trim();
        ev.StartsAt = dto.StartsAt;
        ev.EndsAt = dto.EndsAt;
        ev.Venue = dto.Venue?.Trim();
        ev.IsOnline = dto.IsOnline;
        ev.Capacity = dto.Capacity;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(ev.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new NotFoundAppException($"Event {id} not found.");

        _db.Events.Remove(ev);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<EventAttendeeDto>> ListAttendeesAsync(int eventId, CancellationToken ct = default)
    {
        var exists = await _db.Events.AnyAsync(e => e.Id == eventId, ct);
        if (!exists) throw new NotFoundAppException($"Event {eventId} not found.");

        return await _db.EventRegistrations
            .AsNoTracking()
            .Where(r => r.EventId == eventId)
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .OrderBy(r => r.RegisteredAt)
            .Select(r => new EventAttendeeDto(
                r.UserId,
                r.User.Profile != null ? r.User.Profile.FullName : r.User.Email,
                r.User.Profile != null ? r.User.Profile.Headline : null,
                r.User.Email,
                r.RegisteredAt))
            .ToListAsync(ct);
    }

    public async Task RegisterAsync(int eventId, CancellationToken ct = default)
    {
        var ev = await _db.Events
            .Include(e => e.Registrations)
            .FirstOrDefaultAsync(e => e.Id == eventId, ct)
            ?? throw new NotFoundAppException($"Event {eventId} not found.");

        var userId = _currentUser.UserId;
        if (ev.Registrations.Any(r => r.UserId == userId))
            throw new ConflictAppException("You are already registered for this event.");

        if (ev.Capacity.HasValue && ev.Registrations.Count >= ev.Capacity.Value)
            throw new ConflictAppException("This event has reached its capacity.");

        _db.EventRegistrations.Add(new EventRegistration { EventId = eventId, UserId = userId });
        await _db.SaveChangesAsync(ct);
    }

    public async Task UnregisterAsync(int eventId, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        var registration = await _db.EventRegistrations
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId, ct)
            ?? throw new NotFoundAppException("You are not registered for this event.");

        _db.EventRegistrations.Remove(registration);
        await _db.SaveChangesAsync(ct);
    }
}
