using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>Admin console: manage users and their roles.</summary>
public class AdminService : IAdminService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public AdminService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<AdminUserDto>> ListUsersAsync(CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .Select(u => new AdminUserDto(
                u.Id,
                u.Email,
                u.Profile != null ? u.Profile.FullName : string.Empty,
                u.Role,
                u.Status,
                u.Profile != null ? u.Profile.Cohort : null,
                u.Profile != null ? u.Profile.Location : null,
                u.Profile != null ? u.Profile.EmploymentStatus : Domain.Enums.EmploymentStatus.Unspecified,
                u.Profile != null && u.Profile.IsMentor,
                u.Profile != null ? u.Profile.Skills.Select(s => s.Name).ToList() : new List<string>(),
                u.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<AdminUserDto> UpdateRoleAsync(int userId, UpdateUserRoleDto dto, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Profile).ThenInclude(p => p!.Skills)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException($"User {userId} not found.");

        user.Role = dto.Role;
        await _db.SaveChangesAsync(ct);

        return new AdminUserDto(
            user.Id, user.Email, user.Profile?.FullName ?? string.Empty,
            user.Role, user.Status, user.Profile?.Cohort, user.Profile?.Location,
            user.Profile?.EmploymentStatus ?? Domain.Enums.EmploymentStatus.Unspecified,
            user.Profile?.IsMentor ?? false,
            user.Profile?.Skills.Select(s => s.Name).ToList() ?? new List<string>(),
            user.CreatedAt);
    }

    public async Task<IReadOnlyList<AdminMentorshipDto>> ListMentorshipsAsync(CancellationToken ct = default)
    {
        return await _db.Connections
            .AsNoTracking()
            .Where(c => c.Type == Domain.Enums.ConnectionType.Mentorship)
            .Include(c => c.Requester).ThenInclude(u => u.Profile)
            .Include(c => c.Addressee).ThenInclude(u => u.Profile)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new AdminMentorshipDto(
                c.Id,
                c.RequesterId,
                c.Requester.Profile != null ? c.Requester.Profile.FullName : c.Requester.Email,
                c.AddresseeId,
                c.Addressee.Profile != null ? c.Addressee.Profile.FullName : c.Addressee.Email,
                c.Status,
                c.Message,
                c.CreatedAt,
                c.RespondedAt))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<AccountApprovalDto>> ListPendingApprovalsAsync(CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Status == Domain.Enums.AccountStatus.Pending
                        || u.Status == Domain.Enums.AccountStatus.InfoRequested)
            .Include(u => u.Profile).ThenInclude(p => p!.Skills)
            .OrderBy(u => u.CreatedAt)
            .Select(u => new AccountApprovalDto(
                u.Id,
                u.Email,
                u.Profile != null ? u.Profile.FullName : string.Empty,
                u.Role,
                u.Profile != null ? u.Profile.Cohort : null,
                u.Profile != null ? u.Profile.Location : null,
                u.Profile != null ? u.Profile.Industry : null,
                u.Profile != null ? u.Profile.Headline : null,
                u.Profile != null ? u.Profile.Skills.Select(s => s.Name).ToList() : new List<string>(),
                u.Status,
                u.ReviewNote,
                u.CreatedAt,
                u.ReviewedAt))
            .ToListAsync(ct);
    }

    public Task<AccountApprovalDto> ApproveAsync(int userId, CancellationToken ct = default)
        => ReviewAsync(userId, Domain.Enums.AccountStatus.Approved, null, ct);

    public Task<AccountApprovalDto> RejectAsync(int userId, ReviewAccountDto dto, CancellationToken ct = default)
        => ReviewAsync(userId, Domain.Enums.AccountStatus.Rejected, dto.Note, ct);

    public Task<AccountApprovalDto> RequestInfoAsync(int userId, ReviewAccountDto dto, CancellationToken ct = default)
        => ReviewAsync(userId, Domain.Enums.AccountStatus.InfoRequested, dto.Note, ct);

    private async Task<AccountApprovalDto> ReviewAsync(
        int userId, Domain.Enums.AccountStatus status, string? note, CancellationToken ct)
    {
        var user = await _db.Users
            .Include(u => u.Profile).ThenInclude(p => p!.Skills)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException($"User {userId} not found.");

        if (user.Role == Domain.Enums.UserRole.Admin)
            throw new ValidationAppException("Administrator accounts do not go through approval.");

        user.Status = status;
        user.ReviewNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        user.ReviewedAt = DateTime.UtcNow;
        user.ReviewedByAdminId = _currentUser.UserId;
        await _db.SaveChangesAsync(ct);

        return new AccountApprovalDto(
            user.Id, user.Email, user.Profile?.FullName ?? string.Empty, user.Role,
            user.Profile?.Cohort, user.Profile?.Location, user.Profile?.Industry, user.Profile?.Headline,
            user.Profile?.Skills.Select(s => s.Name).ToList() ?? new List<string>(),
            user.Status, user.ReviewNote, user.CreatedAt, user.ReviewedAt);
    }

    public async Task DeleteUserAsync(int userId, CancellationToken ct = default)
    {
        if (userId == _currentUser.UserId)
            throw new ValidationAppException("You cannot delete your own account.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException($"User {userId} not found.");

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
    }
}
