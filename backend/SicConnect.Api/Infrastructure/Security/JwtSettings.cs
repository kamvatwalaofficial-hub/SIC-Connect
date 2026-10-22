namespace SicConnect.Api.Infrastructure.Security;

/// <summary>
/// Strongly-typed JWT configuration bound from the "Jwt" section of appsettings.
/// </summary>
public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "SicConnect";
    public string Audience { get; set; } = "SicConnectClient";
    /// <summary>Symmetric signing key. Override in configuration/secrets for any real deployment.</summary>
    public string Secret { get; set; } = string.Empty;
    /// <summary>Access-token lifetime in minutes.</summary>
    public int ExpiryMinutes { get; set; } = 120;
}
