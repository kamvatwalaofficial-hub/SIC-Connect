using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Connections and mentorship requests, plus the "AI networking suggestions" feature —
/// a transparent, explainable heuristic (prototype logic, not an external model) that ranks
/// other alumni by shared skills, cohort, industry and mentor availability.
/// </summary>
public class NetworkingService : INetworkingService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notifications;

    public NetworkingService(AppDbContext db, ICurrentUser currentUser, INotificationService notifications)
    {
        _db = db;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<IReadOnlyList<ConnectionDto>> ListMineAsync(CancellationToken ct = default)
    {
        var me = _currentUser.UserId;

        var rows = await _db.Connections
            .AsNoTracking()
            .Where(c => c.RequesterId == me || c.AddresseeId == me)
            .Include(c => c.Requester).ThenInclude(u => u.Profile)
            .Include(c => c.Addressee).ThenInclude(u => u.Profile)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

        return rows.Select(c => ToDto(c, me)).ToList();
    }

    public async Task<ConnectionDto> RequestAsync(CreateConnectionDto dto, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;
        if (dto.AddresseeUserId == me)
            throw new ValidationAppException("You cannot connect with yourself.");

        var addressee = await _db.Users.Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == dto.AddresseeUserId, ct)
            ?? throw new NotFoundAppException("User not found.");

        var exists = await _db.Connections.AnyAsync(c =>
            c.Type == dto.Type &&
            ((c.RequesterId == me && c.AddresseeId == dto.AddresseeUserId) ||
             (c.RequesterId == dto.AddresseeUserId && c.AddresseeId == me)), ct);

        if (exists)
            throw new ConflictAppException("A request between you two already exists.");

        var connection = new Connection
        {
            RequesterId = me,
            AddresseeId = dto.AddresseeUserId,
            Type = dto.Type,
            Status = ConnectionStatus.Pending,
            Message = dto.Message?.Trim()
        };

        _db.Connections.Add(connection);
        await _db.SaveChangesAsync(ct);

        var verb = dto.Type == ConnectionType.Mentorship ? "a mentorship request" : "a connection request";
        var myName = await MyNameAsync(ct);
        await _notifications.NotifyAsync(dto.AddresseeUserId, $"{myName} sent you {verb}.", "/networking", ct);

        connection.Requester = await _db.Users.Include(u => u.Profile).FirstAsync(u => u.Id == me, ct);
        connection.Addressee = addressee;
        return ToDto(connection, me);
    }

    public async Task<ConnectionDto> RespondAsync(int connectionId, RespondConnectionDto dto, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;
        var connection = await _db.Connections
            .Include(c => c.Requester).ThenInclude(u => u.Profile)
            .Include(c => c.Addressee).ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(c => c.Id == connectionId, ct)
            ?? throw new NotFoundAppException("Request not found.");

        if (connection.AddresseeId != me)
            throw new ForbiddenAppException("Only the recipient can respond to this request.");
        if (connection.Status != ConnectionStatus.Pending)
            throw new ValidationAppException("This request has already been answered.");

        connection.Status = dto.Accept ? ConnectionStatus.Accepted : ConnectionStatus.Declined;
        connection.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        if (dto.Accept)
        {
            var myName = await MyNameAsync(ct);
            await _notifications.NotifyAsync(connection.RequesterId, $"{myName} accepted your request.", "/networking", ct);
        }

        return ToDto(connection, me);
    }

    public async Task RemoveAsync(int connectionId, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;
        var connection = await _db.Connections.FirstOrDefaultAsync(c => c.Id == connectionId, ct)
            ?? throw new NotFoundAppException("Request not found.");

        if (connection.RequesterId != me && connection.AddresseeId != me)
            throw new ForbiddenAppException("You are not part of this connection.");

        _db.Connections.Remove(connection);
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Prototype "AI" networking suggestions. Scoring (all transparent):
    /// shared skill +3 each, same cohort +2, same industry +2, is a mentor +2, has a CV/portfolio +1.
    /// Users already connected/requested (any status) and the caller are excluded.
    /// </summary>
    public async Task<IReadOnlyList<PersonSuggestionDto>> SuggestAsync(int take = 8, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;

        var myProfile = await _db.Profiles.AsNoTracking()
            .Include(p => p.Skills)
            .FirstOrDefaultAsync(p => p.UserId == me, ct);
        if (myProfile is null) return Array.Empty<PersonSuggestionDto>();

        var mySkills = myProfile.Skills.Select(s => s.Name.Trim().ToLowerInvariant()).ToHashSet();

        // Exclude anyone the caller is already linked with (in either direction, any status).
        var linkedUserIds = await _db.Connections
            .Where(c => c.RequesterId == me || c.AddresseeId == me)
            .Select(c => c.RequesterId == me ? c.AddresseeId : c.RequesterId)
            .ToListAsync(ct);
        var excluded = linkedUserIds.Append(me).ToList();

        var candidates = await _db.Profiles.AsNoTracking()
            .Include(p => p.Skills)
            .Include(p => p.User)
            .Where(p => !excluded.Contains(p.UserId))
            .ToListAsync(ct);

        var suggestions = new List<PersonSuggestionDto>();
        foreach (var p in candidates)
        {
            var reasons = new List<string>();
            var score = 0;

            var candidateSkillNames = p.Skills.Select(s => s.Name.Trim()).ToList();
            var shared = candidateSkillNames
                .Where(s => mySkills.Contains(s.ToLowerInvariant()))
                .Distinct()
                .ToList();

            if (shared.Count > 0)
            {
                score += shared.Count * 3;
                reasons.Add($"{shared.Count} shared skill{(shared.Count > 1 ? "s" : "")}: {string.Join(", ", shared.Take(3))}");
            }
            if (!string.IsNullOrWhiteSpace(myProfile.Cohort) &&
                string.Equals(myProfile.Cohort, p.Cohort, StringComparison.OrdinalIgnoreCase))
            {
                score += 2;
                reasons.Add($"Same cohort ({p.Cohort})");
            }
            if (!string.IsNullOrWhiteSpace(myProfile.Industry) &&
                string.Equals(myProfile.Industry, p.Industry, StringComparison.OrdinalIgnoreCase))
            {
                score += 2;
                reasons.Add($"Same industry ({p.Industry})");
            }
            if (p.IsMentor)
            {
                score += 2;
                reasons.Add("Available as a mentor");
            }

            if (score <= 0) continue;

            suggestions.Add(new PersonSuggestionDto(
                p.UserId, p.FullName, p.Headline, p.Cohort, p.Industry, p.IsMentor,
                shared, score, reasons));
        }

        return suggestions
            .OrderByDescending(s => s.Score)
            .ThenByDescending(s => s.IsMentor)
            .Take(take)
            .ToList();
    }

    private static ConnectionDto ToDto(Connection c, int me)
    {
        var isIncoming = c.AddresseeId == me;
        var counterpart = isIncoming ? c.Requester : c.Addressee;
        return new ConnectionDto(
            c.Id,
            counterpart.Id,
            counterpart.Profile?.FullName ?? counterpart.Email,
            counterpart.Profile?.Headline,
            c.Type,
            c.Status,
            c.Message,
            isIncoming,
            c.CreatedAt,
            counterpart.Profile?.IsMentor ?? false);
    }

    private async Task<string> MyNameAsync(CancellationToken ct)
    {
        var name = await _db.Profiles.AsNoTracking()
            .Where(p => p.UserId == _currentUser.UserId)
            .Select(p => p.FullName)
            .FirstOrDefaultAsync(ct);
        return string.IsNullOrWhiteSpace(name) ? "Someone" : name;
    }
}
