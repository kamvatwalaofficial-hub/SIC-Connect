using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/leaderboard")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboard;

    public LeaderboardController(ILeaderboardService leaderboard) => _leaderboard = leaderboard;

    /// <summary>
    /// Recognition leaderboard. <paramref name="board"/> is "alumni" (default) or "mentor";
    /// returns the top competitors plus the caller's own rank.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(LeaderboardResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeaderboardResultDto>> Get(
        [FromQuery] string board = "alumni", [FromQuery] int top = 10, CancellationToken ct = default)
        => Ok(await _leaderboard.GetAsync(board, top, ct));
}
