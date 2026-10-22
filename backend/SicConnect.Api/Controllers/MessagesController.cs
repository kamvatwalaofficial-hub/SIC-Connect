using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/messages")]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messages;

    public MessagesController(IMessageService messages) => _messages = messages;

    /// <summary>List the authenticated user's conversations (connections + anyone messaged).</summary>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(IReadOnlyList<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ConversationDto>>> Conversations(CancellationToken ct)
        => Ok(await _messages.GetConversationsAsync(ct));

    /// <summary>Total unread messages (for the navigation badge).</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> UnreadCount(CancellationToken ct)
        => Ok(await _messages.UnreadCountAsync(ct));

    /// <summary>Get the thread with a given user and mark their messages as read.</summary>
    [HttpGet("{otherUserId:int}")]
    [ProducesResponseType(typeof(ThreadDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ThreadDto>> Thread(int otherUserId, CancellationToken ct)
        => Ok(await _messages.GetThreadAsync(otherUserId, ct));

    /// <summary>Send a message to a connected user.</summary>
    [HttpPost("{otherUserId:int}")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<MessageDto>> Send(int otherUserId, SendMessageDto dto, CancellationToken ct)
        => StatusCode(StatusCodes.Status201Created, await _messages.SendAsync(otherUserId, dto, ct));
}
