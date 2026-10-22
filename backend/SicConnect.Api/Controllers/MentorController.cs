using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/mentor")]
public class MentorController : ControllerBase
{
    private readonly IMentorService _mentor;

    public MentorController(IMentorService mentor) => _mentor = mentor;

    /// <summary>Whether the current alumnus can apply to become a mentor, plus their progress.</summary>
    [HttpGet("eligibility")]
    [ProducesResponseType(typeof(MentorEligibilityDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MentorEligibilityDto>> Eligibility(CancellationToken ct)
        => Ok(await _mentor.GetEligibilityAsync(ct));

    /// <summary>Submit a mentor application (validated against eligibility; notifies admins).</summary>
    [HttpPost("apply")]
    [ProducesResponseType(typeof(MentorApplyResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MentorApplyResultDto>> Apply(CancellationToken ct)
        => Ok(await _mentor.ApplyAsync(ct));
}
