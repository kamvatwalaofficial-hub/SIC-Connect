using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Registration and login. Creates the User + empty AlumniProfile on register, verifies
/// the BCrypt hash on login, and issues a JWT in both cases.
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _tokens;

    public AuthService(AppDbContext db, IPasswordHasher hasher, IJwtTokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<RegistrationResultDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictAppException("An account with this email already exists.");

        // New accounts are held for administrator approval before they can sign in.
        var user = new User
        {
            Email = email,
            PasswordHash = _hasher.Hash(dto.Password),
            Role = UserRole.Alumni,
            Status = AccountStatus.Pending,
            Profile = new AlumniProfile
            {
                FullName = dto.FullName.Trim(),
                Cohort = string.IsNullOrWhiteSpace(dto.Cohort) ? null : dto.Cohort.Trim()
            }
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return new RegistrationResultDto(
            AccountStatus.Pending,
            "Your account has been created and is awaiting administrator approval. " +
            "You'll be able to sign in once a Samsung Innovation Campus administrator has verified your details.",
            RequiresApproval: true);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !_hasher.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAppException("Invalid email or password.");

        if (user.Status != AccountStatus.Approved)
            throw new AccountNotApprovedAppException(StatusMessage(user), user.Status.ToString());

        return BuildResponse(user);
    }

    private static string StatusMessage(User user) => user.Status switch
    {
        AccountStatus.Pending => "Your account is awaiting administrator approval. Please check back once it has been reviewed.",
        AccountStatus.Rejected => string.IsNullOrWhiteSpace(user.ReviewNote)
            ? "Your account application was not approved."
            : $"Your account application was not approved: {user.ReviewNote}",
        AccountStatus.InfoRequested => string.IsNullOrWhiteSpace(user.ReviewNote)
            ? "An administrator has requested more information before approving your account."
            : $"More information is needed before your account can be approved: {user.ReviewNote}",
        _ => "Your account cannot sign in at this time.",
    };

    private AuthResponseDto BuildResponse(User user)
    {
        var (token, expiresAt) = _tokens.CreateToken(user);
        return new AuthResponseDto(
            token,
            expiresAt,
            user.Id,
            user.Email,
            user.Profile?.FullName ?? string.Empty,
            user.Role);
    }
}
