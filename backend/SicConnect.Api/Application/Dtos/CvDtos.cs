namespace SicConnect.Api.Application.Dtos;

/// <summary>Result of uploading (or clearing) a profile CV. CvUrl is null once removed.</summary>
public record CvResultDto(string? CvUrl);
