using System.Security.Claims;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Application.Common;

/// <summary>
/// Reads the authenticated principal from the current HTTP context. Registered scoped
/// so services can depend on <see cref="ICurrentUser"/> without touching HttpContext.
/// </summary>
public class CurrentUser : ICurrentUser
{
    private readonly ClaimsPrincipal? _principal;

    public CurrentUser(IHttpContextAccessor accessor)
    {
        _principal = accessor.HttpContext?.User;
    }

    public bool IsAuthenticated => _principal?.Identity?.IsAuthenticated ?? false;

    public int UserId
    {
        get
        {
            var raw = _principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(raw, out var id) ? id : 0;
        }
    }

    public string? Email => _principal?.FindFirstValue(ClaimTypes.Email);

    public UserRole Role
    {
        get
        {
            var raw = _principal?.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(raw, out var role) ? role : UserRole.Alumni;
        }
    }

    public bool IsAdmin => Role == UserRole.Admin;
}
