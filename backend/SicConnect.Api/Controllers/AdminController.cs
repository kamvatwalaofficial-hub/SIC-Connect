using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    /// <summary>List all users for the admin console.</summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> ListUsers(CancellationToken ct)
        => Ok(await _admin.ListUsersAsync(ct));

    /// <summary>Change a user's role.</summary>
    [HttpPut("users/{id:int}/role")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminUserDto>> UpdateRole(int id, UpdateUserRoleDto dto, CancellationToken ct)
        => Ok(await _admin.UpdateRoleAsync(id, dto, ct));

    /// <summary>Delete a user account.</summary>
    [HttpDelete("users/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
    {
        await _admin.DeleteUserAsync(id, ct);
        return NoContent();
    }

    /// <summary>All mentorship requests/relationships across the platform (read-only oversight).</summary>
    [HttpGet("mentorships")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminMentorshipDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminMentorshipDto>>> Mentorships(CancellationToken ct)
        => Ok(await _admin.ListMentorshipsAsync(ct));

    // ----- Account Approval Queue -----

    /// <summary>Pending (and info-requested) registrations awaiting review.</summary>
    [HttpGet("approvals")]
    [ProducesResponseType(typeof(IReadOnlyList<AccountApprovalDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AccountApprovalDto>>> Approvals(CancellationToken ct)
        => Ok(await _admin.ListPendingApprovalsAsync(ct));

    /// <summary>Approve a pending account, granting full platform access.</summary>
    [HttpPost("approvals/{id:int}/approve")]
    [ProducesResponseType(typeof(AccountApprovalDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AccountApprovalDto>> Approve(int id, CancellationToken ct)
        => Ok(await _admin.ApproveAsync(id, ct));

    /// <summary>Reject a pending account, with an optional reason.</summary>
    [HttpPost("approvals/{id:int}/reject")]
    [ProducesResponseType(typeof(AccountApprovalDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AccountApprovalDto>> Reject(int id, ReviewAccountDto dto, CancellationToken ct)
        => Ok(await _admin.RejectAsync(id, dto, ct));

    /// <summary>Ask the applicant for additional verification information.</summary>
    [HttpPost("approvals/{id:int}/request-info")]
    [ProducesResponseType(typeof(AccountApprovalDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AccountApprovalDto>> RequestInfo(int id, ReviewAccountDto dto, CancellationToken ct)
        => Ok(await _admin.RequestInfoAsync(id, dto, ct));
}
