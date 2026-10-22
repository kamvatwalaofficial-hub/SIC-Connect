namespace SicConnect.Api.Application.Dtos;

public record EventDto(
    int Id,
    string Title,
    string? Description,
    DateTime StartsAt,
    DateTime? EndsAt,
    string? Venue,
    bool IsOnline,
    int? Capacity,
    int RegistrationCount,
    bool IsRegistered,
    DateTime CreatedAt);

public record CreateEventDto(
    string Title,
    string? Description,
    DateTime StartsAt,
    DateTime? EndsAt,
    string? Venue,
    bool IsOnline,
    int? Capacity);

/// <summary>An attendee registered for an event (admin attendee list).</summary>
public record EventAttendeeDto(
    int UserId,
    string FullName,
    string? Headline,
    string Email,
    DateTime RegisteredAt);
