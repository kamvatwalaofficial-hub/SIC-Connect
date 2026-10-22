namespace SicConnect.Api.Application.Dtos;

/// <summary>A single ranked competitor on a recognition leaderboard.</summary>
public record LeaderboardEntryDto(
    int Rank,
    int UserId,
    string FullName,
    string? Headline,
    string? AvatarUrl,
    string? Cohort,
    bool IsMentor,
    int Xp,
    bool IsMe);

/// <summary>
/// A leaderboard response: the top N competitors plus the caller's own row so the UI can
/// show "You are ranked #N" even when the caller is outside the top N.
/// </summary>
public record LeaderboardResultDto(
    string Board,
    IReadOnlyList<LeaderboardEntryDto> Top,
    LeaderboardEntryDto? Me,
    int TotalCompetitors);
