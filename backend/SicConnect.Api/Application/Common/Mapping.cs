using SicConnect.Api.Application.Dtos;
using SicConnect.Api.Domain.Entities;

namespace SicConnect.Api.Application.Common;

/// <summary>Entity → DTO projections. Kept in one place so controllers never see entities.</summary>
public static class Mapping
{
    public static SkillDto ToDto(this Skill s) => new(s.Id, s.Name, s.Level);

    public static CertificationDto ToDto(this Certification c) =>
        new(c.Id, c.Name, c.Issuer, c.IssuedOn, c.CredentialUrl);

    public static ProjectDto ToDto(this Project p) =>
        new(p.Id, p.Title, p.Summary, p.TechStack, p.GitHubUrl, p.DemoUrl, p.Achievements, p.CreatedAt);

    public static ProfileDto ToDto(this AlumniProfile p, User user) => new(
        p.Id,
        p.UserId,
        user.Email,
        p.FullName,
        p.Cohort,
        p.Location,
        p.Industry,
        p.EmploymentStatus,
        p.Bio,
        p.Headline,
        p.AvatarUrl,
        p.LinkedInUrl,
        p.GitHubUrl,
        p.CvUrl,
        p.IsMentor,
        user.Role,
        p.Skills.Select(ToDto).ToList(),
        p.Certifications.Select(ToDto).ToList(),
        p.Projects.OrderByDescending(x => x.CreatedAt).Select(ToDto).ToList());

    public static OpportunityDto ToDto(this Opportunity o) => new(
        o.Id, o.Type, o.Title, o.Organisation, o.Description, o.Location,
        o.ApplyUrl, o.Deadline, o.IsMentorshipTagged, o.CreatedAt);

    public static AnnouncementDto ToDto(this Announcement a) =>
        new(a.Id, a.Title, a.Body, a.Audience, a.PublishedAt);
}
