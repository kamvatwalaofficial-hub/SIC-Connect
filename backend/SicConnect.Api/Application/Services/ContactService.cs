using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Handles public "Contact us" submissions. Rather than introducing a new table, each message
/// is delivered to every administrator through the existing notification system, so admins see
/// visitors' comments in their Notifications feed. Email/ticketing delivery is a production seam.
/// </summary>
public class ContactService : IContactService
{
    private readonly AppDbContext _db;

    // Notification.Message is capped at 500 chars in the schema; keep the composed line within it.
    private const int MaxNotificationLength = 500;

    public ContactService(AppDbContext db) => _db = db;

    public async Task<ContactResultDto> SubmitAsync(ContactMessageDto dto, CancellationToken ct = default)
    {
        var name = dto.Name.Trim();
        var email = dto.Email.Trim();
        var subject = string.IsNullOrWhiteSpace(dto.Subject) ? null : dto.Subject.Trim();
        var body = dto.Message.Trim();

        var prefix = subject is null
            ? $"Contact message from {name} <{email}>: "
            : $"Contact message from {name} <{email}> — {subject}: ";

        var message = Truncate(prefix + body, MaxNotificationLength);

        var adminIds = await _db.Users
            .Where(u => u.Role == UserRole.Admin)
            .Select(u => u.Id)
            .ToListAsync(ct);

        foreach (var adminId in adminIds)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = adminId,
                Message = message,
                Link = "/notifications",
            });
        }

        if (adminIds.Count > 0)
            await _db.SaveChangesAsync(ct);

        return new ContactResultDto("Thanks! Your message has been sent to the SIC Connect team.");
    }

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..(max - 1)] + "…";
}
