namespace SicConnect.Api.Application.Services;

/// <summary>
/// Single source of truth for the recognition score ("XP"). Both the leaderboards and the
/// mentor-eligibility check use this so the weighting can never drift between features.
/// The score is currently derived from activity that already exists in the database; when a
/// dedicated event-sourced XP ledger is introduced, only this class needs to change.
/// </summary>
public static class RecognitionScoring
{
    public const int XpPerSkill = 10;
    public const int XpPerCertification = 25;
    public const int XpPerProject = 20;
    public const int XpPerConnection = 5;
    public const int XpPerEvent = 15;

    /// <summary>Minimum XP an alumnus must reach before they can apply to become a mentor.</summary>
    public const int MentorXpThreshold = 150;

    public static int Score(int skills, int certifications, int projects, int connections, int events)
        => skills * XpPerSkill
           + certifications * XpPerCertification
           + projects * XpPerProject
           + connections * XpPerConnection
           + events * XpPerEvent;
}
