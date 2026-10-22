using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Domain.Entities;

namespace SicConnect.Api.Infrastructure.Data;

/// <summary>
/// EF Core code-first context. Owns the relational schema; reached only through the
/// Infrastructure layer. Relationships and constraints are configured in
/// <see cref="OnModelCreating"/>.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<AlumniProfile> Profiles => Set<AlumniProfile>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventRegistration> EventRegistrations => Set<EventRegistration>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Connection> Connections => Set<Connection>();
    public DbSet<OpportunityApplication> OpportunityApplications => Set<OpportunityApplication>();
    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ---------- User ----------
        b.Entity<User>(e =>
        {
            e.Property(u => u.Email).IsRequired().HasMaxLength(256);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);

            // Stored as a readable string. The default backfills existing rows to Approved
            // during migration so no current account is locked out by the new workflow.
            e.Property(u => u.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(Domain.Enums.AccountStatus.Approved);
            e.Property(u => u.ReviewNote).HasMaxLength(1000);

            e.HasOne(u => u.Profile)
                .WithOne(p => p.User)
                .HasForeignKey<AlumniProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- AlumniProfile ----------
        b.Entity<AlumniProfile>(e =>
        {
            e.Property(p => p.FullName).IsRequired().HasMaxLength(150);
            e.Property(p => p.Cohort).HasMaxLength(50);
            e.Property(p => p.Location).HasMaxLength(120);
            e.Property(p => p.Industry).HasMaxLength(120);
            e.Property(p => p.EmploymentStatus).HasConversion<string>().HasMaxLength(30);
            e.Property(p => p.Bio).HasMaxLength(2000);
            e.Property(p => p.Headline).HasMaxLength(200);
            e.HasIndex(p => p.UserId).IsUnique();

            e.HasMany(p => p.Skills)
                .WithOne(s => s.Profile)
                .HasForeignKey(s => s.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(p => p.Certifications)
                .WithOne(c => c.Profile)
                .HasForeignKey(c => c.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(p => p.Projects)
                .WithOne(pr => pr.Profile)
                .HasForeignKey(pr => pr.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- Skill / Certification / Project ----------
        b.Entity<Skill>(e =>
        {
            e.Property(s => s.Name).IsRequired().HasMaxLength(100);
            e.Property(s => s.Level).HasMaxLength(40);
        });

        b.Entity<Certification>(e =>
        {
            e.Property(c => c.Name).IsRequired().HasMaxLength(150);
            e.Property(c => c.Issuer).HasMaxLength(150);
        });

        b.Entity<Project>(e =>
        {
            e.Property(p => p.Title).IsRequired().HasMaxLength(150);
            e.Property(p => p.Summary).HasMaxLength(1000);
            e.Property(p => p.TechStack).HasMaxLength(300);
        });

        // ---------- Opportunity ----------
        b.Entity<Opportunity>(e =>
        {
            e.Property(o => o.Type).HasConversion<string>().HasMaxLength(30);
            e.Property(o => o.Title).IsRequired().HasMaxLength(200);
            e.Property(o => o.Organisation).IsRequired().HasMaxLength(200);
            e.Property(o => o.Description).HasMaxLength(4000);

            e.HasOne(o => o.PostedByAdmin)
                .WithMany()
                .HasForeignKey(o => o.PostedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Event ----------
        b.Entity<Event>(e =>
        {
            e.Property(ev => ev.Title).IsRequired().HasMaxLength(200);
            e.Property(ev => ev.Description).HasMaxLength(4000);
            e.Property(ev => ev.Venue).HasMaxLength(250);

            e.HasOne(ev => ev.CreatedByAdmin)
                .WithMany()
                .HasForeignKey(ev => ev.CreatedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- EventRegistration ----------
        b.Entity<EventRegistration>(e =>
        {
            e.HasIndex(r => new { r.EventId, r.UserId }).IsUnique();

            e.HasOne(r => r.Event)
                .WithMany(ev => ev.Registrations)
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.User)
                .WithMany(u => u.EventRegistrations)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Announcement ----------
        b.Entity<Announcement>(e =>
        {
            e.Property(a => a.Title).IsRequired().HasMaxLength(200);
            e.Property(a => a.Body).IsRequired().HasMaxLength(8000);
            e.Property(a => a.Audience).HasMaxLength(40);

            e.HasOne(a => a.PublishedByAdmin)
                .WithMany()
                .HasForeignKey(a => a.PublishedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Notification ----------
        b.Entity<Notification>(e =>
        {
            e.Property(n => n.Message).IsRequired().HasMaxLength(500);
            e.Property(n => n.Link).HasMaxLength(200);

            e.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- Connection ----------
        b.Entity<Connection>(e =>
        {
            e.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.Message).HasMaxLength(500);

            // A given directional request of a given type is unique between two users.
            e.HasIndex(c => new { c.RequesterId, c.AddresseeId, c.Type }).IsUnique();

            e.HasOne(c => c.Requester)
                .WithMany()
                .HasForeignKey(c => c.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Addressee)
                .WithMany()
                .HasForeignKey(c => c.AddresseeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Message ----------
        b.Entity<Message>(e =>
        {
            e.Property(m => m.Body).IsRequired().HasMaxLength(4000);
            e.HasIndex(m => new { m.SenderId, m.RecipientId });
            e.HasIndex(m => new { m.RecipientId, m.ReadAt });

            e.HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(m => m.Recipient)
                .WithMany()
                .HasForeignKey(m => m.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- OpportunityApplication ----------
        b.Entity<OpportunityApplication>(e =>
        {
            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.CoverNote).HasMaxLength(2000);

            e.HasIndex(a => new { a.OpportunityId, a.UserId }).IsUnique();

            e.HasOne(a => a.Opportunity)
                .WithMany()
                .HasForeignKey(a => a.OpportunityId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
