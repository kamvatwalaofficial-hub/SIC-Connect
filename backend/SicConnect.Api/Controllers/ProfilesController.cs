using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;

namespace SicConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profiles")]
public class ProfilesController : ControllerBase
{
    private readonly IProfileService _profiles;
    private readonly ICvService _cv;

    public ProfilesController(IProfileService profiles, ICvService cv)
    {
        _profiles = profiles;
        _cv = cv;
    }

    /// <summary>Get the authenticated user's own profile.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProfileDto>> GetMine(CancellationToken ct)
        => Ok(await _profiles.GetMineAsync(ct));

    /// <summary>Update the authenticated user's own profile (skills/certifications replace existing sets).</summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProfileDto>> UpdateMine(UpdateProfileDto dto, CancellationToken ct)
        => Ok(await _profiles.UpdateMineAsync(dto, ct));

    /// <summary>Upload the authenticated user's CV as a PDF (max 5 MB). Replaces any existing CV.</summary>
    [HttpPost("me/cv")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [ProducesResponseType(typeof(CvResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CvResultDto>> UploadCv([FromForm] IFormFile? file, CancellationToken ct)
        => Ok(await _cv.UploadAsync(file, ct));

    /// <summary>Remove the authenticated user's uploaded CV.</summary>
    [HttpDelete("me/cv")]
    [ProducesResponseType(typeof(CvResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CvResultDto>> DeleteCv(CancellationToken ct)
        => Ok(await _cv.DeleteAsync(ct));

    /// <summary>Download a stored CV PDF. Anonymous so it can open directly in a browser tab.</summary>
    [AllowAnonymous]
    [HttpGet("cv/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DownloadCv(string fileName)
    {
        var path = _cv.ResolvePhysicalPath(fileName);
        if (path is null) return NotFound();
        return PhysicalFile(path, "application/pdf");
    }
}
