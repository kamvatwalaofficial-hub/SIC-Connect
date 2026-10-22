namespace SicConnect.Api.Application.Dtos;

public record ProjectDto(
    int Id,
    string Title,
    string? Summary,
    string? TechStack,
    string? GitHubUrl,
    string? DemoUrl,
    string? Achievements,
    DateTime CreatedAt);

public record CreateProjectDto(
    string Title,
    string? Summary,
    string? TechStack,
    string? GitHubUrl,
    string? DemoUrl,
    string? Achievements);
