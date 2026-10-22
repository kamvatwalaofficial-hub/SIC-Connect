using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/announcements")]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcements;

    public AnnouncementsController(IAnnouncementService announcements) => _announcements = announcements;

    /// <summary>Read the latest announcements.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AnnouncementDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AnnouncementDto>>> List(CancellationToken ct)
        => Ok(await _announcements.ListAsync(ct));

    /// <summary>Broadcast a new announcement (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(AnnouncementDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AnnouncementDto>> Create(CreateAnnouncementDto dto, CancellationToken ct)
    {
        var created = await _announcements.CreateAsync(dto, ct);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    /// <summary>Delete an announcement (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _announcements.DeleteAsync(id, ct);
        return NoContent();
    }
}
