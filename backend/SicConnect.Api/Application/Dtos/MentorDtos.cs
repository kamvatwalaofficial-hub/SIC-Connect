namespace SicConnect.Api.Application.Dtos;

/// <summary>
/// Whether the current alumnus may apply to become a mentor, and their progress toward it.
/// Drives the "Apply to Become a Mentor" button's enabled/disabled state and helper text.
/// </summary>
public record MentorEligibilityDto(
    int Xp,
    int RequiredXp,
    bool ProfileComplete,
    bool AlreadyMentor,
    bool IsEligible,
    IReadOnlyList<string> UnmetRequirements);

/// <summary>Result of submitting a mentor application.</summary>
public record MentorApplyResultDto(string Message);
