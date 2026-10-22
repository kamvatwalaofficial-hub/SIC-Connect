using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analytics;

    public AnalyticsController(IAnalyticsService analytics) => _analytics = analytics;

    /// <summary>Aggregated dashboard metrics (Admin only).</summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(AnalyticsSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AnalyticsSummaryDto>> Summary(CancellationToken ct)
        => Ok(await _analytics.GetSummaryAsync(ct));

    /// <summary>Comprehensive administrator dashboard data (Admin only).</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard(CancellationToken ct)
        => Ok(await _analytics.GetDashboardAsync(ct));
}
