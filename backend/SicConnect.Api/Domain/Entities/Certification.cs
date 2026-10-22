namespace SicConnect.Api.Domain.Entities;

/// <summary>A credential earned by an alumnus, attached to their profile.</summary>
public class Certification
{
    public int Id { get; set; }
    public int ProfileId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public DateTime? IssuedOn { get; set; }
    public string? CredentialUrl { get; set; }

    // Navigation
    public AlumniProfile Profile { get; set; } = null!;
}
