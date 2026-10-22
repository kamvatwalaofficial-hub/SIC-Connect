# 01 — Domain entities, enums & DbContext

All new files go under `Domain/Entities` and `Domain/Enums`, mirroring the existing style
(plain POCOs, nullable reference types, navigation collections initialised). Add the
`DbSet`s and `OnModelCreating` config to `Infrastructure/Data/AppDbContext.cs`.

## Enums — `Domain/Enums/`

```csharp
// BadgeRarity.cs
namespace SicConnect.Api.Domain.Enums;
public enum BadgeRarity { Common = 0, Rare = 1, Epic = 2, Legendary = 3 }

// BadgeRuleType.cs — how a badge is auto-evaluated (threshold compares against a counter).
namespace SicConnect.Api.Domain.Enums;
public enum BadgeRuleType
{
    ProfileCompleted = 0,
    FirstProject = 1,
    ProjectsCompleted = 2,
    FirstEventAttended = 3,
    EventsAttended = 4,
    FirstConnection = 5,
    ConnectionsAccepted = 6,
    BecameMentor = 7,
    MentorshipsCompleted = 8,
    XpThreshold = 9,
    FirstLogin = 10,
    WorkshopsAttended = 11,
    HackathonsAttended = 12
}

// MentorApplicationStatus.cs
namespace SicConnect.Api.Domain.Enums;
public enum MentorApplicationStatus { Pending = 0, Approved = 1, Rejected = 2, InfoRequested = 3 }

// MentorshipStatus.cs
namespace SicConnect.Api.Domain.Enums;
public enum MentorshipStatus { Active = 0, Completed = 1, Cancelled = 2 }

// ProfileDocumentType.cs
namespace SicConnect.Api.Domain.Enums;
public enum ProfileDocumentType { Cv = 0, Certification = 1 }
```

## Profile enhancements (additive columns on the existing `AlumniProfile`)

Add these properties to `Domain/Entities/AlumniProfile.cs`. They are all nullable /
defaulted, so existing rows are unaffected and every current read/write keeps working.

```csharp
    // ----- Professional profile (atomic, POPIA-minimised) -----
    public string? FirstName { get; set; }
    public string? Surname { get; set; }
    public string? Programme { get; set; }          // SIC programme completed
    public string? Occupation { get; set; }         // optional current occupation

    // Atomic address — each part stored on its own (existing free-text Location is kept
    // for backward-compatibility and can be derived from these on write).
    public string? StreetAddress { get; set; }
    public string? Suburb { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    // Mentor availability toggle (defaults to the existing IsMentor opt-in on migration).
    public bool IsAvailableToMentor { get; set; }

    // Denormalised XP cache for fast leaderboard reads (kept in sync by XpService).
    public int TotalXp { get; set; }

    // Navigation
    public ICollection<ProfileDocument> Documents { get; set; } = new List<ProfileDocument>();
    public ICollection<UserBadge> Badges { get; set; } = new List<UserBadge>();
```

> Keeping `TotalXp` on the profile (rather than a separate `UserXp` table) avoids an extra
> join on every leaderboard/profile read and needs no new PK relationship. It is a cache;
> the authoritative history is `XpTransaction`.

## New entities — `Domain/Entities/`

```csharp
// ProfileDocument.cs — CV (single) + certifications (multiple) file references.
namespace SicConnect.Api.Domain.Entities;
public class ProfileDocument
{
    public int Id { get; set; }
    public int ProfileId { get; set; }
    public Domain.Enums.ProfileDocumentType Type { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty; // private blob key / path
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public AlumniProfile Profile { get; set; } = null!;
}

// SkillCatalogItem.cs — admin-extendable predefined skills (reference data).
namespace SicConnect.Api.Domain.Entities;
public class SkillCatalogItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;   // unique
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
}

// XpActionConfig.cs — admin-configurable point value per activity. No code change to tune.
namespace SicConnect.Api.Domain.Entities;
public class XpActionConfig
{
    public int Id { get; set; }
    public string ActionKey { get; set; } = string.Empty; // unique, e.g. "PROJECT_COMPLETED"
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Points { get; set; }
    public bool IsRepeatable { get; set; }                 // false = award once per reference
    public bool IsActive { get; set; } = true;
}

// XpTransaction.cs — immutable ledger. IdempotencyKey enforces "no duplicate rewards".
namespace SicConnect.Api.Domain.Entities;
public class XpTransaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ActionKey { get; set; } = string.Empty;
    public int Points { get; set; }
    public string? ReferenceType { get; set; }             // e.g. "Project", "Connection"
    public int? ReferenceId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty; // unique
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = null!;
}

// BadgeDefinition.cs — admin-configurable badge catalogue.
namespace SicConnect.Api.Domain.Entities;
public class BadgeDefinition
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;        // unique, e.g. "COMMUNITY_CONNECTOR"
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "🏅";               // emoji or icon name
    public Domain.Enums.BadgeRarity Rarity { get; set; } = Domain.Enums.BadgeRarity.Common;
    public Domain.Enums.BadgeRuleType RuleType { get; set; }
    public int Threshold { get; set; }                     // counter target (1 for "first")
    public int XpReward { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

// UserBadge.cs — an unlocked badge. Unique (UserId, BadgeDefinitionId). CelebratedAt drives modals.
namespace SicConnect.Api.Domain.Entities;
public class UserBadge
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int BadgeDefinitionId { get; set; }
    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CelebratedAt { get; set; }            // null = not yet shown to the user
    public User User { get; set; } = null!;
    public BadgeDefinition Badge { get; set; } = null!;
}

// MentorApplication.cs — request to become a mentor; flows into the admin approval queue.
namespace SicConnect.Api.Domain.Entities;
public class MentorApplication
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public Domain.Enums.MentorApplicationStatus Status { get; set; } = Domain.Enums.MentorApplicationStatus.Pending;
    public string? Motivation { get; set; }
    public int XpAtApply { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public string? ReviewNote { get; set; }
    public User User { get; set; } = null!;
}

// Mentorship.cs — a managed engagement created when a mentorship request is accepted.
namespace SicConnect.Api.Domain.Entities;
public class Mentorship
{
    public int Id { get; set; }
    public int MentorUserId { get; set; }
    public int MenteeUserId { get; set; }
    public Domain.Enums.MentorshipStatus Status { get; set; } = Domain.Enums.MentorshipStatus.Active;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime DueAt { get; set; }                    // StartedAt + settings.DurationDays
    public DateTime? CompletedAt { get; set; }
    public int? ConnectionId { get; set; }                 // link to the accepted Connection (optional)
}

// RecognitionSettings.cs — singleton (Id = 1) of admin-tunable knobs.
namespace SicConnect.Api.Domain.Entities;
public class RecognitionSettings
{
    public int Id { get; set; }                            // always 1
    public int MentorMinXp { get; set; } = 500;
    public bool RequireVerifiedAccount { get; set; } = true;   // AccountStatus.Approved
    public bool RequireCompleteProfile { get; set; } = true;
    public int MaxActiveMentees { get; set; } = 3;
    public int MentorshipDurationDays { get; set; } = 90;
    public int MentorCompletionXp { get; set; } = 200;
    public int MenteeCompletionXp { get; set; } = 120;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

## `AppDbContext` additions

```csharp
public DbSet<ProfileDocument> ProfileDocuments => Set<ProfileDocument>();
public DbSet<SkillCatalogItem> SkillCatalog => Set<SkillCatalogItem>();
public DbSet<XpActionConfig> XpActionConfigs => Set<XpActionConfig>();
public DbSet<XpTransaction> XpTransactions => Set<XpTransaction>();
public DbSet<BadgeDefinition> BadgeDefinitions => Set<BadgeDefinition>();
public DbSet<UserBadge> UserBadges => Set<UserBadge>();
public DbSet<MentorApplication> MentorApplications => Set<MentorApplication>();
public DbSet<Mentorship> Mentorships => Set<Mentorship>();
public DbSet<RecognitionSettings> RecognitionSettings => Set<RecognitionSettings>();
```

In `OnModelCreating(ModelBuilder b)`:

```csharp
b.Entity<XpActionConfig>().HasIndex(x => x.ActionKey).IsUnique();
b.Entity<XpTransaction>().HasIndex(x => x.IdempotencyKey).IsUnique();
b.Entity<XpTransaction>().HasIndex(x => x.UserId);
b.Entity<BadgeDefinition>().HasIndex(x => x.Key).IsUnique();
b.Entity<UserBadge>().HasIndex(x => new { x.UserId, x.BadgeDefinitionId }).IsUnique();
b.Entity<SkillCatalogItem>().HasIndex(x => x.Name).IsUnique();
b.Entity<Mentorship>().HasIndex(x => new { x.MentorUserId, x.Status });
b.Entity<ProfileDocument>()
    .HasOne(d => d.Profile).WithMany(p => p.Documents)
    .HasForeignKey(d => d.ProfileId).OnDelete(DeleteBehavior.Cascade);
b.Entity<UserBadge>()
    .HasOne(ub => ub.Badge).WithMany()
    .HasForeignKey(ub => ub.BadgeDefinitionId).OnDelete(DeleteBehavior.Restrict);
// Restrict deletes on User FKs (XpTransaction, UserBadge, MentorApplication) to avoid
// multiple-cascade-path errors on SQL Server; clean up in DeleteUserAsync instead.
b.Entity<XpTransaction>().HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Restrict);
b.Entity<UserBadge>().HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Restrict);
b.Entity<MentorApplication>().HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Restrict);
```

> **SQL Server note:** the `Restrict` on User FKs is deliberate — SQL Server rejects
> multiple cascade paths. Extend the existing `AdminService.DeleteUserAsync` to remove a
> user's `XpTransactions`, `UserBadges`, `MentorApplications` and `Mentorships` before
> deleting the user (see `04-dtos-controllers-di.md`).
