using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications) => _notifications = notifications;

    /// <summary>List the authenticated user's most recent notifications.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> List(CancellationToken ct)
        => Ok(await _notifications.ListMineAsync(ct));

    /// <summary>Count of unread notifications (for the header badge).</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> UnreadCount(CancellationToken ct)
        => Ok(await _notifications.UnreadCountAsync(ct));

    /// <summary>Mark a single notification as read.</summary>
    [HttpPost("{id:int}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        await _notifications.MarkReadAsync(id, ct);
        return NoContent();
    }

    /// <summary>Mark all notifications as read.</summary>
    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _notifications.MarkAllReadAsync(ct);
        return NoContent();
    }
}
