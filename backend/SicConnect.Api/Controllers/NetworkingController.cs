using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/networking")]
public class NetworkingController : ControllerBase
{
    private readonly INetworkingService _networking;

    public NetworkingController(INetworkingService networking) => _networking = networking;

    /// <summary>List the authenticated user's connections and mentorship requests.</summary>
    [HttpGet("connections")]
    [ProducesResponseType(typeof(IReadOnlyList<ConnectionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ConnectionDto>>> Connections(CancellationToken ct)
        => Ok(await _networking.ListMineAsync(ct));

    /// <summary>Send a connection or mentorship request. Alumni/Mentors only — administrators cannot.</summary>
    [Authorize(Roles = "Alumni,Mentor")]
    [HttpPost("connections")]
    [ProducesResponseType(typeof(ConnectionDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ConnectionDto>> Request(CreateConnectionDto dto, CancellationToken ct)
        => StatusCode(StatusCodes.Status201Created, await _networking.RequestAsync(dto, ct));

    /// <summary>Accept or decline a pending request.</summary>
    [HttpPost("connections/{id:int}/respond")]
    [ProducesResponseType(typeof(ConnectionDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConnectionDto>> Respond(int id, RespondConnectionDto dto, CancellationToken ct)
        => Ok(await _networking.RespondAsync(id, dto, ct));

    /// <summary>Remove a connection or withdraw a request.</summary>
    [HttpDelete("connections/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(int id, CancellationToken ct)
    {
        await _networking.RemoveAsync(id, ct);
        return NoContent();
    }

    /// <summary>AI networking suggestions — people you may want to connect with (prototype heuristic).</summary>
    [HttpGet("suggestions")]
    [ProducesResponseType(typeof(IReadOnlyList<PersonSuggestionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PersonSuggestionDto>>> Suggestions(CancellationToken ct)
        => Ok(await _networking.SuggestAsync(8, ct));
}
