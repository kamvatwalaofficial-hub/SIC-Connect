using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>Lists opportunities for all alumni; publishing/deleting is admin-only.</summary>
public class OpportunityService : IOpportunityService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public OpportunityService(AppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<OpportunityDto>> ListAsync(CancellationToken ct = default)
    {
        return await _db.Opportunities
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => o.ToDto())
            .ToListAsync(ct);
    }

    public async Task<OpportunityDto> GetAsync(int id, CancellationToken ct = default)
    {
        var o = await _db.Opportunities.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundAppException($"Opportunity {id} not found.");
        return o.ToDto();
    }

    public async Task<OpportunityDto> CreateAsync(CreateOpportunityDto dto, CancellationToken ct = default)
    {
        var opportunity = new Opportunity
        {
            Type = dto.Type,
            Title = dto.Title.Trim(),
            Organisation = dto.Organisation.Trim(),
            Description = dto.Description?.Trim(),
            Location = dto.Location?.Trim(),
            ApplyUrl = dto.ApplyUrl?.Trim(),
            Deadline = dto.Deadline,
            IsMentorshipTagged = dto.IsMentorshipTagged,
            PostedByAdminId = _currentUser.UserId
        };

        _db.Opportunities.Add(opportunity);
        await _db.SaveChangesAsync(ct);
        return opportunity.ToDto();
    }

    public async Task<OpportunityDto> UpdateAsync(int id, CreateOpportunityDto dto, CancellationToken ct = default)
    {
        var opportunity = await _db.Opportunities.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundAppException($"Opportunity {id} not found.");

        opportunity.Type = dto.Type;
        opportunity.Title = dto.Title.Trim();
        opportunity.Organisation = dto.Organisation.Trim();
        opportunity.Description = dto.Description?.Trim();
        opportunity.Location = dto.Location?.Trim();
        opportunity.ApplyUrl = dto.ApplyUrl?.Trim();
        opportunity.Deadline = dto.Deadline;
        opportunity.IsMentorshipTagged = dto.IsMentorshipTagged;

        await _db.SaveChangesAsync(ct);
        return opportunity.ToDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var opportunity = await _db.Opportunities.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundAppException($"Opportunity {id} not found.");

        _db.Opportunities.Remove(opportunity);
        await _db.SaveChangesAsync(ct);
    }
}
