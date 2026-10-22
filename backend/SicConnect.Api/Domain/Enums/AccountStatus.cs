namespace SicConnect.Api.Domain.Enums;

/// <summary>
/// Account approval lifecycle. New registrations start <see cref="Pending"/> and must be
/// approved by an administrator before they can sign in. Existing accounts are migrated to
/// <see cref="Approved"/> (the database column default) so no current user is locked out.
/// </summary>
public enum AccountStatus
{
    Approved = 0,
    Pending = 1,
    Rejected = 2,
    /// <summary>Administrator has asked the applicant for more verification information.</summary>
    InfoRequested = 3
}
