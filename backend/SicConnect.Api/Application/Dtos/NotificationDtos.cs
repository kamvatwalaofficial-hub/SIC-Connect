namespace SicConnect.Api.Application.Dtos;

public record NotificationDto(
    int Id,
    string Message,
    string? Link,
    bool IsRead,
    DateTime CreatedAt);
