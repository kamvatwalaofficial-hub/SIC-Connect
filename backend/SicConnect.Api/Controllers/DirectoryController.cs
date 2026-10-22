using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/directory")]
public class DirectoryController : ControllerBase
{
    private readonly IDirectoryService _directory;

    public DirectoryController(IDirectoryService directory) => _directory = directory;

    /// <summary>Search and filter the alumni directory by skill, cohort, location, industry, employment and free text.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<DirectoryItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<DirectoryItemDto>>> Search(
        [FromQuery] DirectoryQueryDto query, CancellationToken ct)
        => Ok(await _directory.SearchAsync(query, ct));
}
