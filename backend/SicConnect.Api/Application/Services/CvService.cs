using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Infrastructure.Data;

namespace SicConnect.Api.Application.Services;

/// <summary>
/// Stores the authenticated user's CV as an uploaded PDF on the server's filesystem and keeps
/// the profile's <c>CvUrl</c> pointing at the download route. Reuses the existing CvUrl column,
/// so no schema change is required. File storage is a documented production seam — for a scaled
/// deployment this would move to blob storage behind the same interface.
/// </summary>
public class CvService : ICvService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly IWebHostEnvironment _env;

    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB
    private const string SubDir = "cv";

    public CvService(AppDbContext db, ICurrentUser currentUser, IWebHostEnvironment env)
    {
        _db = db;
        _currentUser = currentUser;
        _env = env;
    }

    public async Task<CvResultDto> UploadAsync(IFormFile? file, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            throw new ValidationAppException("Please choose a PDF file to upload.");
        if (file.Length > MaxBytes)
            throw new ValidationAppException("The CV must be 5 MB or smaller.");

        var isPdf = file.ContentType is "application/pdf" or "application/x-pdf"
                    && Path.GetExtension(file.FileName).Equals(".pdf", StringComparison.OrdinalIgnoreCase);
        if (!isPdf)
            throw new ValidationAppException("Only PDF files are accepted.");

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == _currentUser.UserId, ct)
            ?? throw new NotFoundAppException("Profile not found.");

        var dir = StorageDir();
        Directory.CreateDirectory(dir);

        // Remove any previously uploaded CV before storing the replacement.
        DeleteStoredFile(profile.CvUrl);

        var fileName = $"{Guid.NewGuid():N}.pdf";
        var fullPath = Path.Combine(dir, fileName);
        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, ct);
        }

        profile.CvUrl = $"/api/profiles/cv/{fileName}";
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new CvResultDto(profile.CvUrl);
    }

    public async Task<CvResultDto> DeleteAsync(CancellationToken ct = default)
    {
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == _currentUser.UserId, ct)
            ?? throw new NotFoundAppException("Profile not found.");

        DeleteStoredFile(profile.CvUrl);
        profile.CvUrl = null;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new CvResultDto(null);
    }

    /// <summary>Resolves a stored CV file name to a physical path, or null if it is missing/invalid.</summary>
    public string? ResolvePhysicalPath(string fileName)
    {
        // Guard against path traversal: only accept a bare "<hex>.pdf" file name.
        var safe = Path.GetFileName(fileName);
        if (string.IsNullOrEmpty(safe) ||
            !safe.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) ||
            safe != fileName)
        {
            return null;
        }

        var fullPath = Path.Combine(StorageDir(), safe);
        return File.Exists(fullPath) ? fullPath : null;
    }

    private string StorageDir() => Path.Combine(_env.ContentRootPath, "uploads", SubDir);

    private void DeleteStoredFile(string? cvUrl)
    {
        if (string.IsNullOrEmpty(cvUrl) || !cvUrl.StartsWith("/api/profiles/cv/", StringComparison.Ordinal))
            return;

        var existing = ResolvePhysicalPath(Path.GetFileName(cvUrl));
        if (existing is not null)
        {
            try { File.Delete(existing); } catch (IOException) { /* best effort */ }
        }
    }
}
