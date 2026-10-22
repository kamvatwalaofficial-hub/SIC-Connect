# 05 — Migration & seed data

## Create + apply the migration

```bash
cd backend/SicConnect.Api
dotnet build                                   # verify entities/services compile
dotnet ef migrations add AddRecognitionSystem  # generates the migration + snapshot
dotnet ef database update                      # or rely on start-up MigrateAndSeedAsync
```

The migration only **adds** tables and **adds** nullable/defaulted columns to `AlumniProfile`.
Existing rows are untouched. Recommended one-time backfill inside the migration's `Up` (or in
`DbSeeder` after migrate): set `IsAvailableToMentor = IsMentor`, `TotalXp = 0`, and copy
`Location` into `City` where atomic parts are null (optional).

## Seed (idempotent) — extend `Infrastructure/Data/DbSeeder.cs`

Seed only when the tables are empty, matching the existing seeder style. These rows are the
**defaults**; admins tune them live via `/api/admin/recognition/*`.

### Recognition settings (singleton)

```csharp
if (!await db.RecognitionSettings.AnyAsync(ct))
    db.RecognitionSettings.Add(new RecognitionSettings { Id = 1 }); // defaults from the entity
```

### XP action configuration — weighted so effort/impact is rewarded

```csharp
if (!await db.XpActionConfigs.AnyAsync(ct))
{
    db.XpActionConfigs.AddRange(
      // key,                         display,                         pts, repeatable
      New("PROFILE_PICTURE",          "Uploaded a profile picture",     20, false),
      New("CV_UPLOADED",              "Uploaded a CV",                  30, false),
      New("SKILLS_SELECTED",          "Selected skills",                15, false),
      New("CERTIFICATION_UPLOADED",   "Uploaded a certification",       25, true),
      New("PROFILE_COMPLETED",        "Completed professional profile", 75, false),
      New("PROJECT_UPLOADED",         "Uploaded a project",            120, true),   // high-value
      New("PROJECT_COMPLETED",        "Completed a project",           150, true),   // higher
      New("PROJECT_APPROVED",         "Project approved",               80, true),
      New("FIRST_CONNECTION",         "Made a first connection",        50, false),
      New("CONNECTION_ACCEPTED",      "New accepted connection",        15, true),
      New("EVENT_RSVP",               "RSVP’d to an event",             10, true),
      New("EVENT_ATTENDED",           "Attended an event",              40, true),
      New("WORKSHOP_ATTENDED",        "Attended a technical workshop",  90, true),   // > social
      New("HACKATHON_ATTENDED",       "Participated in a hackathon",   130, true),
      New("TRAINING_COMPLETED",       "Completed a training session",   70, true),
      New("BECAME_MENTOR",            "Became a mentor",               200, false),
      New("MENTORSHIP_ACCEPTED",      "Accepted a mentee",             100, true),
      New("MENTORSHIP_COMPLETED_MENTOR","Completed mentoring a mentee",200, true),
      New("MENTORSHIP_COMPLETED_MENTEE","Completed a mentorship",      120, true),
      New("COMMUNITY_CONTRIBUTION",   "Published a community post",     60, true)
    );
}
static XpActionConfig New(string k, string d, int p, bool r) =>
    new() { ActionKey = k, DisplayName = d, Points = p, IsRepeatable = r, IsActive = true };
```

> Weighting rationale (all editable in the admin UI): projects (120–150) > workshops/hackathons
> (90–130) > events (40) > social networking (10–15) > profile touches (15–30). Mentoring is
> substantial (100–200). This directly satisfies the "intelligent XP weighting" requirement
> without hard-coding — the values live in the DB.

### Badge catalogue — rarity, thresholds, XP rewards

```csharp
if (!await db.BadgeDefinitions.AnyAsync(ct))
{
    db.BadgeDefinitions.AddRange(
      // key, title, description, icon, rarity, ruleType, threshold, xp, sort
      B("FIRST_LOGIN","First Login","Welcome to SIC Connect!","👋",Common,FirstLogin,1,10,1),
      B("PROFILE_COMPLETED","Profile Completed","Filled out your professional profile","✅",Common,ProfileCompleted,1,50,2),
      B("FIRST_PROJECT","First Project Uploaded","Shared your first project","🚀",Common,FirstProject,1,40,3),
      B("FIVE_PROJECTS","Five Projects Completed","Completed five projects","🏗️",Rare,ProjectsCompleted,5,150,4),
      B("SKILLS_BUILDER","Skills Builder","Added 5+ skills to your profile","🧠",Common,ProfileCompleted,1,30,5),
      B("FIRST_EVENT","First Event Attended","Attended your first event","🎟️",Common,FirstEventAttended,1,40,6),
      B("WORKSHOP_CHAMPION","Workshop Champion","Attended 5 technical workshops","🛠️",Epic,WorkshopsAttended,5,200,7),
      B("HACKATHON_PARTICIPANT","Hackathon Participant","Joined a hackathon","⚡",Rare,HackathonsAttended,1,120,8),
      B("NETWORKING_BEGINNER","Networking Beginner","Made your first connection","🤝",Common,FirstConnection,1,50,9),
      B("COMMUNITY_CONNECTOR","Community Connector","Reached 10 accepted connections","🌐",Rare,ConnectionsAccepted,10,120,10),
      B("COLLABORATION_EXPERT","Collaboration Expert","Reached 25 accepted connections","🤝",Rare,ConnectionsAccepted,25,180,11),
      B("COMMUNITY_LEADER","Community Leader","Reached 50 accepted connections","👑",Epic,ConnectionsAccepted,50,300,12),
      B("TOP_CONTRIBUTOR","Top Contributor","Reached 100 accepted connections","🏆",Legendary,ConnectionsAccepted,100,600,13),
      B("RISING_STAR","Rising Star","Earned 500 XP","⭐",Rare,XpThreshold,500,0,14),
      B("INNOVATION_CHAMPION","Innovation Champion","Earned 2000 XP","💡",Legendary,XpThreshold,2000,0,15),
      B("MENTOR_APPROVED","Mentor Approved","Became an approved mentor","🎓",Epic,BecameMentor,1,150,16),
      B("MENTORSHIP_COMPLETED","Mentorship Completed","Completed a mentorship cycle","🏅",Rare,MentorshipsCompleted,1,120,17),
      B("OUTSTANDING_MENTOR","Outstanding Mentor","Completed 5 mentorships","🌟",Legendary,MentorshipsCompleted,5,500,18)
    );
}
static BadgeDefinition B(string k,string t,string d,string i,BadgeRarity r,BadgeRuleType rt,int th,int xp,int s)=>
    new(){Key=k,Title=t,Description=d,Icon=i,Rarity=r,RuleType=rt,Threshold=th,XpReward=xp,SortOrder=s,IsActive=true};
```

### Skills catalogue

Seed `SkillCatalogItem` from the same list the front end ships in
`frontend/.../lib/skillsCatalog.js` (keep them in sync, or serve the API list to the client).

```csharp
if (!await db.SkillCatalog.AnyAsync(ct))
    db.SkillCatalog.AddRange(defaultSkills.Select(n => new SkillCatalogItem { Name = n }));
```

Finish with a single `await db.SaveChangesAsync(ct);` at the end of the seed block, exactly
like the existing seeder.

## Verifying "nothing broke"

After `dotnet ef database update`:
- Existing endpoints (`/api/profiles/me`, `/api/events`, `/api/opportunities`, auth) return
  unchanged shapes — the new profile columns are additive and the DTOs only *add* fields.
- `SELECT TotalXp, IsAvailableToMentor FROM Profiles` shows `0` / mirrored `IsMentor`.
- New tables exist and are seeded; no existing row was modified.
