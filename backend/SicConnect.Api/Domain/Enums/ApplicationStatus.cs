namespace SicConnect.Api.Domain.Enums;

/// <summary>Lifecycle of an application to an opportunity.</summary>
public enum ApplicationStatus
{
    Submitted = 0,
    UnderReview = 1,
    Accepted = 2,
    Rejected = 3,
    Withdrawn = 4
}
