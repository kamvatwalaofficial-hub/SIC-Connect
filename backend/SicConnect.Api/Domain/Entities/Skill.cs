namespace SicConnect.Api.Domain.Entities;

/// <summary>A named competency attached to an alumnus profile, with an optional proficiency level.</summary>
public class Skill
{
    public int Id { get; set; }
    public int ProfileId { get; set; }

    public string Name { get; set; } = string.Empty;
    /// <summary>Free-form proficiency, e.g. "Beginner", "Intermediate", "Expert".</summary>
    public string? Level { get; set; }

    // Navigation
    public AlumniProfile Profile { get; set; } = null!;
}
