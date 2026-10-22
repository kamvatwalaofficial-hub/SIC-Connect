using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/events")]
public class EventsController : ControllerBase
{
    private readonly IEventService _events;

    public EventsController(IEventService events) => _events = events;

    /// <summary>Browse all events (with registration counts and the caller's registration state).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<EventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> List(CancellationToken ct)
        => Ok(await _events.ListAsync(ct));

    /// <summary>Get a single event by id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EventDto>> Get(int id, CancellationToken ct)
        => Ok(await _events.GetAsync(id, ct));

    /// <summary>Create a new event (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<EventDto>> Create(CreateEventDto dto, CancellationToken ct)
    {
        var created = await _events.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    /// <summary>Update an event (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EventDto>> Update(int id, CreateEventDto dto, CancellationToken ct)
        => Ok(await _events.UpdateAsync(id, dto, ct));

    /// <summary>Delete an event (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _events.DeleteAsync(id, ct);
        return NoContent();
    }

    /// <summary>List the attendees registered for an event (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("{id:int}/attendees")]
    [ProducesResponseType(typeof(IReadOnlyList<EventAttendeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EventAttendeeDto>>> Attendees(int id, CancellationToken ct)
        => Ok(await _events.ListAttendeesAsync(id, ct));

    /// <summary>Register the authenticated user to attend an event.</summary>
    [HttpPost("{id:int}/register")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Register(int id, CancellationToken ct)
    {
        await _events.RegisterAsync(id, ct);
        return NoContent();
    }

    /// <summary>Cancel the authenticated user's registration for an event.</summary>
    [HttpDelete("{id:int}/register")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unregister(int id, CancellationToken ct)
    {
        await _events.UnregisterAsync(id, ct);
        return NoContent();
    }
}
