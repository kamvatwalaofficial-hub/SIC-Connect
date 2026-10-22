using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Domain.Enums;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>Applications to opportunities. Alumni apply; admins review and update status.</summary>
public class ApplicationService : IApplicationService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly INotificationService _notifications;

    public ApplicationService(AppDbContext db, ICurrentUser currentUser, INotificationService notifications)
    {
        _db = db;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<ApplicationDto> ApplyAsync(int opportunityId, CreateApplicationDto dto, CancellationToken ct = default)
    {
        var opportunity = await _db.Opportunities.FirstOrDefaultAsync(o => o.Id == opportunityId, ct)
            ?? throw new NotFoundAppException($"Opportunity {opportunityId} not found.");

        var me = _currentUser.UserId;
        if (await _db.OpportunityApplications.AnyAsync(a => a.OpportunityId == opportunityId && a.UserId == me, ct))
            throw new ConflictAppException("You have already applied to this opportunity.");

        var application = new OpportunityApplication
        {
            OpportunityId = opportunityId,
            UserId = me,
            Status = ApplicationStatus.Submitted,
            CoverNote = dto.CoverNote?.Trim()
        };

        _db.OpportunityApplications.Add(application);
        await _db.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(opportunity.PostedByAdminId,
            $"New application for “{opportunity.Title}”.", "/opportunities", ct);

        return await GetDtoAsync(application.Id, ct);
    }

    public async Task<IReadOnlyList<ApplicationDto>> ListMineAsync(CancellationToken ct = default)
    {
        var me = _currentUser.UserId;
        return await Query().Where(a => a.UserId == me)
            .OrderByDescending(a => a.CreatedAt)
            .Select(Projection())
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ApplicationDto>> ListForOpportunityAsync(int opportunityId, CancellationToken ct = default)
    {
        return await Query().Where(a => a.OpportunityId == opportunityId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(Projection())
            .ToListAsync(ct);
    }

    public async Task<ApplicationDto> UpdateStatusAsync(int applicationId, UpdateApplicationStatusDto dto, CancellationToken ct = default)
    {
        var application = await _db.OpportunityApplications
            .Include(a => a.Opportunity)
            .FirstOrDefaultAsync(a => a.Id == applicationId, ct)
            ?? throw new NotFoundAppException("Application not found.");

        application.Status = dto.Status;
        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(application.UserId,
            $"Your application for “{application.Opportunity.Title}” is now {dto.Status}.", "/applications", ct);

        return await GetDtoAsync(applicationId, ct);
    }

    public async Task WithdrawAsync(int applicationId, CancellationToken ct = default)
    {
        var me = _currentUser.UserId;
        var application = await _db.OpportunityApplications.FirstOrDefaultAsync(a => a.Id == applicationId, ct)
            ?? throw new NotFoundAppException("Application not found.");

        if (application.UserId != me)
            throw new ForbiddenAppException("You can only withdraw your own applications.");

        _db.OpportunityApplications.Remove(application);
        await _db.SaveChangesAsync(ct);
    }

    private IQueryable<OpportunityApplication> Query() =>
        _db.OpportunityApplications.AsNoTracking()
            .Include(a => a.Opportunity)
            .Include(a => a.User).ThenInclude(u => u.Profile);

    private static System.Linq.Expressions.Expression<Func<OpportunityApplication, ApplicationDto>> Projection() =>
        a => new ApplicationDto(
            a.Id,
            a.OpportunityId,
            a.Opportunity.Title,
            a.Opportunity.Organisation,
            a.Opportunity.Type,
            a.UserId,
            a.User.Profile != null ? a.User.Profile.FullName : a.User.Email,
            a.Status,
            a.CoverNote,
            a.CreatedAt);

    private async Task<ApplicationDto> GetDtoAsync(int id, CancellationToken ct) =>
        await Query().Where(a => a.Id == id).Select(Projection()).FirstAsync(ct);
}
