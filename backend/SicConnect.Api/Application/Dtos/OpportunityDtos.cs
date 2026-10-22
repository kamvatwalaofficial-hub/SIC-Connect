using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Dtos;

public record OpportunityDto(
    int Id,
    OpportunityType Type,
    string Title,
    string Organisation,
    string? Description,
    string? Location,
    string? ApplyUrl,
    DateTime? Deadline,
    bool IsMentorshipTagged,
    DateTime CreatedAt);

public record CreateOpportunityDto(
    OpportunityType Type,
    string Title,
    string Organisation,
    string? Description,
    string? Location,
    string? ApplyUrl,
    DateTime? Deadline,
    bool IsMentorshipTagged);
