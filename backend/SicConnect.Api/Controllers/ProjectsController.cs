using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projects;

    public ProjectsController(IProjectService projects) => _projects = projects;

    /// <summary>List the authenticated user's showcase projects.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProjectDto>>> ListMine(CancellationToken ct)
        => Ok(await _projects.ListMineAsync(ct));

    /// <summary>Add a showcase project. Alumni/Mentors only — administrators keep no portfolio.</summary>
    [Authorize(Roles = "Alumni,Mentor")]
    [HttpPost]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProjectDto>> Create(CreateProjectDto dto, CancellationToken ct)
    {
        var created = await _projects.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(ListMine), new { }, created);
    }

    /// <summary>Delete one of the authenticated user's projects.</summary>
    [Authorize(Roles = "Alumni,Mentor")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _projects.DeleteAsync(id, ct);
        return NoContent();
    }
}
