using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

/// <summary>A connection/mentorship record as seen by one side of it.</summary>
public record ConnectionDto(
    int Id,
    int CounterpartUserId,
    string CounterpartName,
    string? CounterpartHeadline,
    ConnectionType Type,
    ConnectionStatus Status,
    string? Message,
    bool IsIncoming,
    DateTime CreatedAt,
    bool CounterpartIsMentor);

/// <summary>Send a connection or mentorship request to another user.</summary>
public record CreateConnectionDto(int AddresseeUserId, ConnectionType Type, string? Message);

/// <summary>Accept or decline a pending request.</summary>
public record RespondConnectionDto(bool Accept);

/// <summary>
/// A suggested person to connect with, produced by the networking-suggestions heuristic,
/// with a transparent match score and the reasons behind it.
/// </summary>
public record PersonSuggestionDto(
    int UserId,
    string FullName,
    string? Headline,
    string? Cohort,
    string? Industry,
    bool IsMentor,
    IReadOnlyList<string> SharedSkills,
    int Score,
    IReadOnlyList<string> Reasons);
