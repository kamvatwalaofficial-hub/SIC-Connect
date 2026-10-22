using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/applications")]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _applications;

    public ApplicationsController(IApplicationService applications) => _applications = applications;

    /// <summary>List the authenticated user's own opportunity applications.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(IReadOnlyList<ApplicationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ApplicationDto>>> ListMine(CancellationToken ct)
        => Ok(await _applications.ListMineAsync(ct));

    /// <summary>Update an application's status (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/status")]
    [ProducesResponseType(typeof(ApplicationDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApplicationDto>> UpdateStatus(int id, UpdateApplicationStatusDto dto, CancellationToken ct)
        => Ok(await _applications.UpdateStatusAsync(id, dto, ct));

    /// <summary>Withdraw the authenticated user's own application.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Withdraw(int id, CancellationToken ct)
    {
        await _applications.WithdrawAsync(id, ct);
        return NoContent();
    }
}
