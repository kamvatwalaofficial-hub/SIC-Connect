namespace SicConnect.Api.Application.Dtos;

/// <summary>A message submitted from the public Contact page.</summary>
public record ContactMessageDto(
    string Name,
    string Email,
    string? Subject,
    string Message);

/// <summary>Result of submitting a contact message.</summary>
public record ContactResultDto(string Message);
