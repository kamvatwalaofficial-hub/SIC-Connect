using Microsoft.EntityFrameworkCore;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Domain.Entities;
using SicConnect.Api.Domain.Enums;

namespace SicConnect.Api.Infrastructure.Data;

/// <summary>
/// Applies pending migrations and seeds a default admin plus a little sample data so the
/// prototype is demoable immediately. Idempotent — safe to run on every startup.
/// </summary>
public static class DbSeeder
{
    public static async Task MigrateAndSeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        // Prefer EF migrations when they exist; fall back to creating the schema directly
        // so the prototype still runs before the initial migration has been generated.
        if (db.Database.GetMigrations().Any())
            await db.Database.MigrateAsync();
        else
            await db.Database.EnsureCreatedAsync();

        if (await db.Users.AnyAsync())
        {
            // Core data already exists — still top up the demo community idempotently so
            // dashboards, the directory and the recognition leaderboards have enough people
            // to be meaningful, even on databases seeded before this roster was added.
            await SeedDemoCommunityAsync(db, hasher);
            return;
        }

        var adminEmail = (config["Seed:AdminEmail"] ?? "admin@sicconnect.example").ToLowerInvariant();
        var adminPassword = config["Seed:AdminPassword"] ?? "Admin#12345";

        var admin = new User
        {
            Email = adminEmail,
            PasswordHash = hasher.Hash(adminPassword),
            Role = UserRole.Admin,
            Status = AccountStatus.Approved,
            Profile = new AlumniProfile
            {
                FullName = "SIC Administrator",
                Cohort = "Staff",
                Industry = "Programme Management",
                EmploymentStatus = EmploymentStatus.Employed,
                Headline = "Samsung Innovation Campus — Programme Team"
            }
        };

        var mentor = new User
        {
            Email = "mentor@sicconnect.example",
            PasswordHash = hasher.Hash("Mentor#12345"),
            Role = UserRole.Mentor,
            Status = AccountStatus.Approved,
            Profile = new AlumniProfile
            {
                FullName = "Thandiwe Mokoena",
                Cohort = "2023",
                Location = "Johannesburg, ZA",
                Industry = "Software",
                EmploymentStatus = EmploymentStatus.Employed,
                Headline = "Backend Engineer · SIC Mentor",
                IsMentor = true,
                Skills = new List<Skill>
                {
                    new() { Name = "C#", Level = "Expert" },
                    new() { Name = "ASP.NET Core", Level = "Advanced" },
                    new() { Name = "SQL Server", Level = "Advanced" }
                }
            }
        };

        var alumni = new User
        {
            Email = "alumni@sicconnect.example",
            PasswordHash = hasher.Hash("Alumni#12345"),
            Role = UserRole.Alumni,
            Status = AccountStatus.Approved,
            Profile = new AlumniProfile
            {
                FullName = "Sipho Ndlovu",
                Cohort = "2024",
                Location = "Cape Town, ZA",
                Industry = "Web Development",
                EmploymentStatus = EmploymentStatus.SeekingWork,
                Headline = "Frontend Developer · React & Tailwind",
                Skills = new List<Skill>
                {
                    new() { Name = "React", Level = "Advanced" },
                    new() { Name = "JavaScript", Level = "Advanced" },
                    new() { Name = "Tailwind CSS", Level = "Intermediate" }
                },
                Projects = new List<Project>
                {
                    new()
                    {
                        Title = "SIC Study Buddy",
                        Summary = "A collaborative study planner built during the programme.",
                        TechStack = "React, Vite, Tailwind, ASP.NET Core",
                        GitHubUrl = "https://example.com/github/sic-study-buddy"
                    }
                }
            }
        };

        // Two applicants awaiting review, to populate the Account Approval Queue on first run.
        var pendingOne = new User
        {
            Email = "pending1@sicconnect.example",
            PasswordHash = hasher.Hash("Pending#12345"),
            Role = UserRole.Alumni,
            Status = AccountStatus.Pending,
            Profile = new AlumniProfile
            {
                FullName = "Lerato Khumalo",
                Cohort = "2025",
                Location = "Durban, ZA",
                Industry = "Data Science",
                Headline = "Aspiring Data Analyst",
                Skills = new List<Skill> { new() { Name = "Python" }, new() { Name = "SQL" } }
            }
        };
        var pendingTwo = new User
        {
            Email = "pending2@sicconnect.example",
            PasswordHash = hasher.Hash("Pending#12345"),
            Role = UserRole.Alumni,
            Status = AccountStatus.Pending,
            Profile = new AlumniProfile
            {
                FullName = "Ayanda Mthembu",
                Cohort = "2025",
                Location = "Pretoria, ZA",
                Industry = "Software",
                Headline = "Junior Software Engineer",
                Skills = new List<Skill> { new() { Name = "Java" }, new() { Name = "Spring" } }
            }
        };

        db.Users.AddRange(admin, mentor, alumni, pendingOne, pendingTwo);
        await db.SaveChangesAsync();

        var internship = new Opportunity
        {
            Type = OpportunityType.Internship,
            Title = "Software Engineering Intern (React & .NET)",
            Organisation = "Samsung R&D",
            Description = "6-month internship working on Android tooling with React and ASP.NET Core.",
            Location = "Remote / Hybrid",
            IsMentorshipTagged = true,
            PostedByAdminId = admin.Id
        };
        db.Opportunities.AddRange(
            internship,
            new Opportunity
            {
                Type = OpportunityType.Hackathon,
                Title = "SIC Alumni Hackathon 2026",
                Organisation = "Samsung Innovation Campus",
                Description = "48-hour hackathon open to all alumni.",
                Location = "Johannesburg",
                Deadline = DateTime.UtcNow.AddDays(20),
                PostedByAdminId = admin.Id
            });

        db.Events.Add(new Event
        {
            Title = "Alumni Networking Evening",
            Description = "Meet fellow graduates and Samsung engineers.",
            StartsAt = DateTime.UtcNow.AddDays(21),
            Venue = "Samsung Offices, Bryanston",
            Capacity = 100,
            CreatedByAdminId = admin.Id
        });

        db.Announcements.Add(new Announcement
        {
            Title = "Welcome to SIC Connect",
            Body = "The alumni platform is live — complete your profile and explore opportunities.",
            Audience = "All",
            PublishedByAdminId = admin.Id
        });

        await db.SaveChangesAsync();

        // A sample application, mentorship request and a welcome notification so the
        // networking, applications and notification features are populated on first run.
        db.OpportunityApplications.Add(new OpportunityApplication
        {
            OpportunityId = internship.Id,
            UserId = alumni.Id,
            Status = ApplicationStatus.Submitted,
            CoverNote = "Keen to apply my React and .NET skills on real Samsung tooling."
        });

        db.Connections.Add(new Connection
        {
            RequesterId = alumni.Id,
            AddresseeId = mentor.Id,
            Type = ConnectionType.Mentorship,
            Status = ConnectionStatus.Pending,
            Message = "Hi Thandiwe, I'd love your guidance as I break into backend work."
        });

        db.Notifications.Add(new Notification
        {
            UserId = alumni.Id,
            Message = "Welcome to SIC Connect! Complete your profile to get better recommendations.",
            Link = "/profile"
        });

        // An accepted connection between the alumnus and mentor plus a short thread, so the
        // messaging feature is populated and demoable on first run.
        db.Connections.Add(new Connection
        {
            RequesterId = alumni.Id,
            AddresseeId = mentor.Id,
            Type = ConnectionType.Connection,
            Status = ConnectionStatus.Accepted,
            RespondedAt = DateTime.UtcNow.AddDays(-2)
        });

        db.Messages.AddRange(
            new Message
            {
                SenderId = alumni.Id,
                RecipientId = mentor.Id,
                Body = "Hi Thandiwe! Thanks for connecting. Could I ask you a couple of questions about backend roles?",
                SentAt = DateTime.UtcNow.AddHours(-3),
                ReadAt = DateTime.UtcNow.AddHours(-2)
            },
            new Message
            {
                SenderId = mentor.Id,
                RecipientId = alumni.Id,
                Body = "Of course, Sipho — happy to help. What are you working on at the moment?",
                SentAt = DateTime.UtcNow.AddHours(-2)
            });

        await db.SaveChangesAsync();

        // Populate the wider demo community (directory + leaderboards).
        await SeedDemoCommunityAsync(db, hasher);
    }

    /// <summary>
    /// Idempotently adds a richer roster of approved alumni and mentors — each with skills,
    /// certifications and projects — plus a few accepted connections between them, so the
    /// community directory and the recognition leaderboards are populated and demoable.
    /// Runs on every startup; each person is only inserted if their email is not already present.
    /// </summary>
    private static async Task SeedDemoCommunityAsync(AppDbContext db, IPasswordHasher hasher)
    {
        var password = hasher.Hash("Demo#12345");

        // (email, role, profile factory). IssuedOn dates are relative so they stay realistic.
        var roster = new (string Email, UserRole Role, Func<AlumniProfile> Profile)[]
        {
            // ---- Mentors (compete on the mentor leaderboard) ----
            ("naledi.dlamini@sicconnect.example", UserRole.Mentor, () => new AlumniProfile
            {
                FullName = "Naledi Dlamini", Cohort = "SIC-Cohort-2022", Location = "Johannesburg, ZA",
                Industry = "Artificial Intelligence & Machine Learning", EmploymentStatus = EmploymentStatus.Employed,
                Headline = "Machine Learning Engineer · SIC Mentor", IsMentor = true,
                LinkedInUrl = "https://example.com/linkedin/naledi-dlamini", GitHubUrl = "https://example.com/github/naledi-dlamini",
                Skills = Skills("Python", "TensorFlow", "SQL", "Docker", "Pandas"),
                Certifications = Certs(("TensorFlow Developer Certificate", "Google", 400), ("Azure AI Engineer Associate", "Microsoft", 250)),
                Projects = Projects(("Alumni Skill Recommender", "React, FastAPI, scikit-learn"), ("Vision Attendance", "Python, OpenCV")),
            }),
            ("bongani.nkosi@sicconnect.example", UserRole.Mentor, () => new AlumniProfile
            {
                FullName = "Bongani Nkosi", Cohort = "SIC-Cohort-2022", Location = "Pretoria, ZA",
                Industry = "DevOps", EmploymentStatus = EmploymentStatus.Employed,
                Headline = "DevOps Lead · SIC Mentor", IsMentor = true,
                LinkedInUrl = "https://example.com/linkedin/bongani-nkosi", GitHubUrl = "https://example.com/github/bongani-nkosi",
                Skills = Skills("Kubernetes", "AWS", "Terraform", "Docker"),
                Certifications = Certs(("AWS Solutions Architect", "Amazon", 300), ("Certified Kubernetes Administrator", "CNCF", 180)),
                Projects = Projects(("GitOps Starter Kit", "Terraform, ArgoCD, AWS")),
            }),
            ("zanele.khumalo@sicconnect.example", UserRole.Mentor, () => new AlumniProfile
            {
                FullName = "Zanele Khumalo", Cohort = "SIC-Cohort-2023", Location = "Cape Town, ZA",
                Industry = "Cybersecurity", EmploymentStatus = EmploymentStatus.Employed,
                Headline = "Security Analyst · SIC Mentor", IsMentor = true,
                LinkedInUrl = "https://example.com/linkedin/zanele-khumalo", GitHubUrl = "https://example.com/github/zanele-khumalo",
                Skills = Skills("Network Security", "Python", "SIEM"),
                Certifications = Certs(("CompTIA Security+", "CompTIA", 220), ("Certified Ethical Hacker", "EC-Council", 260)),
                Projects = Projects(("Phishing Detector", "Python, scikit-learn")),
            }),

            // ---- Alumni (compete on the alumni leaderboard) ----
            ("kabelo.sithole@sicconnect.example", UserRole.Alumni, () => new AlumniProfile
            {
                FullName = "Kabelo Sithole", Cohort = "SIC-Cohort-2024", Location = "Johannesburg, ZA",
                Industry = "Cloud Computing", EmploymentStatus = EmploymentStatus.Employed,
                Headline = "Cloud Engineer",
                LinkedInUrl = "https://example.com/linkedin/kabelo-sithole", GitHubUrl = "https://example.com/github/kabelo-sithole",
                Skills = Skills("Azure", "C#", "Docker", "Kubernetes"),
                Certifications = Certs(("Azure Fundamentals", "Microsoft", 200), ("Azure Administrator", "Microsoft", 120)),
                Projects = Projects(("Serverless Alumni API", "Azure Functions, C#"), ("Cost Dashboard", "React, Azure")),
            }),
            ("nomsa.zulu@sicconnect.example", UserRole.Alumni, () => new AlumniProfile
            {
                FullName = "Nomsa Zulu", Cohort = "SIC-Cohort-2025", Location = "Durban, ZA",
                Industry = "Data Science & Analytics", EmploymentStatus = EmploymentStatus.SeekingWork,
                Headline = "Data Analyst",
                LinkedInUrl = "https://example.com/linkedin/nomsa-zulu", GitHubUrl = "https://example.com/github/nomsa-zulu",
                Skills = Skills("Python", "SQL", "Power BI"),
                Certifications = Certs(("Google Data Analytics", "Google", 150)),
                Projects = Projects(("Township Retail Insights", "Python, Power BI")),
            }),
            ("ayanda.mokoena@sicconnect.example", UserRole.Alumni, () => new AlumniProfile
            {
                FullName = "Ayanda Mokoena", Cohort = "SIC-Cohort-2024", Location = "Cape Town, ZA",
                Industry = "Mobile Development", EmploymentStatus = EmploymentStatus.Employed,
                Headline = "Mobile Developer",
                LinkedInUrl = "https://example.com/linkedin/ayanda-mokoena", GitHubUrl = "https://example.com/github/ayanda-mokoena",
                Skills = Skills("Kotlin", "Flutter", "Firebase"),
                Projects = Projects(("SIC Events App", "Flutter, Firebase"), ("Study Timer", "Kotlin")),
            }),
            ("thabo.molefe@sicconnect.example", UserRole.Alumni, () => new AlumniProfile
            {
                FullName = "Thabo Molefe", Cohort = "SIC-Cohort-2023", Location = "Johannesburg, ZA",
                Industry = "Quality Assurance / Testing", EmploymentStatus = EmploymentStatus.Employed,
                Headline = "QA Automation Engineer",
                LinkedInUrl = "https://example.com/linkedin/thabo-molefe", GitHubUrl = "https://example.com/github/thabo-molefe",
                Skills = Skills("Selenium", "Cypress", "Playwright"),
                Certifications = Certs(("ISTQB Foundation", "ISTQB", 90)),
            }),
            ("lerato.mahlangu@sicconnect.example", UserRole.Alumni, () => new AlumniProfile
            {
                FullName = "Lerato Mahlangu", Cohort = "SIC-Cohort-2025", Location = "Pretoria, ZA",
                Industry = "UI/UX Design", EmploymentStatus = EmploymentStatus.Freelancing,
                Headline = "UI/UX Designer",
                LinkedInUrl = "https://example.com/linkedin/lerato-mahlangu", GitHubUrl = "https://example.com/github/lerato-mahlangu",
                Skills = Skills("Figma", "Design Systems", "HTML/CSS"),
                Projects = Projects(("SIC Connect Design Kit", "Figma")),
            }),
            ("sizwe.dube@sicconnect.example", UserRole.Alumni, () => new AlumniProfile
            {
                FullName = "Sizwe Dube", Cohort = "SIC-Cohort-2024", Location = "Durban, ZA",
                Industry = "Software Development", EmploymentStatus = EmploymentStatus.Employed,
                Headline = "Backend Developer",
                LinkedInUrl = "https://example.com/linkedin/sizwe-dube", GitHubUrl = "https://example.com/github/sizwe-dube",
                Skills = Skills("C#", "ASP.NET Core", "PostgreSQL", "Redis"),
                Certifications = Certs(("Microsoft Certified: .NET", "Microsoft", 140), ("Scrum Fundamentals", "Scrum.org", 60)),
                Projects = Projects(("Alumni Jobs Aggregator", "ASP.NET Core, PostgreSQL"), ("Realtime Chat", "SignalR, Redis")),
            }),
        };

        var rosterEmails = roster.Select(r => r.Email).ToArray();
        var existing = await db.Users
            .Where(u => rosterEmails.Contains(u.Email))
            .Select(u => u.Email)
            .ToListAsync();

        var added = false;
        foreach (var (email, role, profileFactory) in roster)
        {
            if (existing.Contains(email)) continue;

            db.Users.Add(new User
            {
                Email = email,
                PasswordHash = password,
                Role = role,
                Status = AccountStatus.Approved,
                Profile = profileFactory(),
            });
            added = true;
        }

        if (added)
            await db.SaveChangesAsync();

        // A few accepted peer connections among the demo alumni, so connection-based
        // recognition and the network views have data. Idempotent per pair.
        await EnsureConnectionAsync(db, "kabelo.sithole@sicconnect.example", "nomsa.zulu@sicconnect.example");
        await EnsureConnectionAsync(db, "kabelo.sithole@sicconnect.example", "sizwe.dube@sicconnect.example");
        await EnsureConnectionAsync(db, "sizwe.dube@sicconnect.example", "ayanda.mokoena@sicconnect.example");
        await EnsureConnectionAsync(db, "nomsa.zulu@sicconnect.example", "lerato.mahlangu@sicconnect.example");
    }

    private static List<Skill> Skills(params string[] names)
        => names.Select(n => new Skill { Name = n }).ToList();

    private static List<Certification> Certs(params (string Name, string Issuer, int DaysAgo)[] items)
        => items.Select(c => new Certification
        {
            Name = c.Name,
            Issuer = c.Issuer,
            IssuedOn = DateTime.UtcNow.AddDays(-c.DaysAgo),
        }).ToList();

    private static List<Project> Projects(params (string Title, string TechStack)[] items)
        => items.Select(p => new Project { Title = p.Title, TechStack = p.TechStack }).ToList();

    /// <summary>Adds an accepted connection between two users (by email) if one does not already exist.</summary>
    private static async Task EnsureConnectionAsync(AppDbContext db, string requesterEmail, string addresseeEmail)
    {
        var requester = await db.Users.FirstOrDefaultAsync(u => u.Email == requesterEmail);
        var addressee = await db.Users.FirstOrDefaultAsync(u => u.Email == addresseeEmail);
        if (requester is null || addressee is null) return;

        var exists = await db.Connections.AnyAsync(c =>
            (c.RequesterId == requester.Id && c.AddresseeId == addressee.Id) ||
            (c.RequesterId == addressee.Id && c.AddresseeId == requester.Id));
        if (exists) return;

        db.Connections.Add(new Connection
        {
            RequesterId = requester.Id,
            AddresseeId = addressee.Id,
            Type = ConnectionType.Connection,
            Status = ConnectionStatus.Accepted,
            RespondedAt = DateTime.UtcNow.AddDays(-1),
        });
        await db.SaveChangesAsync();
    }
}
