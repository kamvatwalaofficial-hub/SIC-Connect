using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly IContactService _contact;

    public ContactController(IContactService contact) => _contact = contact;

    /// <summary>Submit a message from the public Contact page. Delivered to administrators.</summary>
    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(typeof(ContactResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ContactResultDto>> Submit(ContactMessageDto dto, CancellationToken ct)
        => Ok(await _contact.SubmitAsync(dto, ct));
}
