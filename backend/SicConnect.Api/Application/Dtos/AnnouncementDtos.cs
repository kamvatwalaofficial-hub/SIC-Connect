namespace SicConnect.Api.Application.Dtos;

public record AnnouncementDto(
    int Id,
    string Title,
    string Body,
    string Audience,
    DateTime PublishedAt);

public record CreateAnnouncementDto(
    string Title,
    string Body,
    string Audience);
