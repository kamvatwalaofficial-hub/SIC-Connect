namespace SicConnect.Api.Application.Dtos;

/// <summary>
/// An opportunity paired with a transparent match score and the reasons it was recommended.
/// Produced by the opportunity-recommendation heuristic (prototype AI logic).
/// </summary>
public record OpportunityRecommendationDto(
    OpportunityDto Opportunity,
    int Score,
    IReadOnlyList<string> Reasons);
