namespace SicConnect.Api.Application.Common;

/// <summary>
/// Base class for expected, client-facing errors. The exception-handling middleware maps
/// the <see cref="StatusCode"/> to the HTTP response, so services can throw these freely.
/// </summary>
public abstract class AppException : Exception
{
    public abstract int StatusCode { get; }
    protected AppException(string message) : base(message) { }
}

/// <summary>400 — the request was understood but failed validation or business rules.</summary>
public class ValidationAppException : AppException
{
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public IReadOnlyDictionary<string, string[]>? Errors { get; }

    public ValidationAppException(string message, IReadOnlyDictionary<string, string[]>? errors = null)
        : base(message) => Errors = errors;
}

/// <summary>401 — authentication failed (bad credentials).</summary>
public class UnauthorizedAppException : AppException
{
    public override int StatusCode => StatusCodes.Status401Unauthorized;
    public UnauthorizedAppException(string message) : base(message) { }
}

/// <summary>403 — authenticated but not permitted.</summary>
public class ForbiddenAppException : AppException
{
    public override int StatusCode => StatusCodes.Status403Forbidden;
    public ForbiddenAppException(string message) : base(message) { }
}

/// <summary>404 — the requested resource does not exist.</summary>
public class NotFoundAppException : AppException
{
    public override int StatusCode => StatusCodes.Status404NotFound;
    public NotFoundAppException(string message) : base(message) { }
}

/// <summary>403 — the credentials were valid but the account is not approved for access.</summary>
public class AccountNotApprovedAppException : ForbiddenAppException
{
    /// <summary>The account's current status, surfaced to the client so it can tailor the message.</summary>
    public string Status { get; }

    public AccountNotApprovedAppException(string message, string status) : base(message) => Status = status;
}

/// <summary>409 — the request conflicts with current state (e.g. duplicate email).</summary>
public class ConflictAppException : AppException
{
    public override int StatusCode => StatusCodes.Status409Conflict;
    public ConflictAppException(string message) : base(message) { }
}
