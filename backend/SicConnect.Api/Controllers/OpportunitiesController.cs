using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/opportunities")]
public class OpportunitiesController : ControllerBase
{
    private readonly IOpportunityService _opportunities;
    private readonly IRecommendationService _recommendations;
    private readonly IApplicationService _applications;

    public OpportunitiesController(
        IOpportunityService opportunities,
        IRecommendationService recommendations,
        IApplicationService applications)
    {
        _opportunities = opportunities;
        _recommendations = recommendations;
        _applications = applications;
    }

    /// <summary>List all published opportunities.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OpportunityDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OpportunityDto>>> List(CancellationToken ct)
        => Ok(await _opportunities.ListAsync(ct));

    /// <summary>AI-powered opportunity recommendations for the authenticated user (prototype heuristic).</summary>
    [HttpGet("recommendations")]
    [ProducesResponseType(typeof(IReadOnlyList<OpportunityRecommendationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OpportunityRecommendationDto>>> Recommendations(CancellationToken ct)
        => Ok(await _recommendations.RecommendOpportunitiesAsync(6, ct));

    /// <summary>Apply to an opportunity. Alumni/Mentors only — administrators cannot apply.</summary>
    [Authorize(Roles = "Alumni,Mentor")]
    [HttpPost("{id:int}/apply")]
    [ProducesResponseType(typeof(ApplicationDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApplicationDto>> Apply(int id, CreateApplicationDto dto, CancellationToken ct)
        => StatusCode(StatusCodes.Status201Created, await _applications.ApplyAsync(id, dto, ct));

    /// <summary>List the applications received for an opportunity (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("{id:int}/applications")]
    [ProducesResponseType(typeof(IReadOnlyList<ApplicationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ApplicationDto>>> Applications(int id, CancellationToken ct)
        => Ok(await _applications.ListForOpportunityAsync(id, ct));

    /// <summary>Get a single opportunity by id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(OpportunityDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OpportunityDto>> Get(int id, CancellationToken ct)
        => Ok(await _opportunities.GetAsync(id, ct));

    /// <summary>Publish a new opportunity (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(OpportunityDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<OpportunityDto>> Create(CreateOpportunityDto dto, CancellationToken ct)
    {
        var created = await _opportunities.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    /// <summary>Update an opportunity (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(OpportunityDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OpportunityDto>> Update(int id, CreateOpportunityDto dto, CancellationToken ct)
        => Ok(await _opportunities.UpdateAsync(id, dto, ct));

    /// <summary>Delete an opportunity (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _opportunities.DeleteAsync(id, ct);
        return NoContent();
    }
}
