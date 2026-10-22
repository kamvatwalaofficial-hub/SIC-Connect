# SIC Connect — Recognition, XP, Badges & Mentor Workflow (Backend Package)

These notes document the design of the recognition system (XP, badges, leaderboards and the
mentor workflow) that is implemented in the API. To apply its migrations to a fresh database:

```bash
cd backend/SicConnect.Api
dotnet build
dotnet ef database update      # or let start-up MigrateAndSeedAsync apply it in Development
```

Everything here is **additive and backward-compatible** — new entities, new services, new
endpoints, and new columns that are all nullable or defaulted. No existing table, column,
DTO, controller, or behaviour is removed or changed. Existing rows migrate cleanly
(new `TotalXp` = 0, new profile columns null, new availability flag = existing `IsMentor`).

## What it delivers

| Capability | Where |
|---|---|
| Professional profile: atomic address, First/Surname, Programme, Occupation, CV + certification documents, availability flag | `01-entities-and-db.md` |
| Admin-extendable **Skills catalogue** | `01-entities-and-db.md` |
| **XP engine** — configurable per-action points, idempotent awarding (no duplicate rewards), weighted values | `02-services.md` |
| **Badge system** — catalogue with rarity, threshold rules, auto-unlock, XP reward | `02-services.md` |
| **Leaderboards** — Alumni & Mentor, Top 10 + "you are ranked #N" | `02-services.md` |
| **Mentor eligibility & application** → admin approval queue | `03-mentor-workflow.md` |
| **Mentor availability toggle**, **capacity (max 3)**, **duration (default 90d)**, auto-completion + XP | `03-mentor-workflow.md` |
| DTOs, controllers, RBAC, DI registration | `04-dtos-controllers-di.md` |
| Migration, seed data (XP config, badge catalogue, settings, skills) | `05-migration-and-seed.md` |
| Frontend wiring (leaderboard panel, badges, celebration modal, eligibility UI, admin settings) — reuses the Part-A components already committed | `06-frontend-integration.md` |

## Design principles honoured

- **Clean architecture** — Domain entities, Application services/interfaces/DTOs, Infrastructure
  persistence, API controllers, exactly like the existing layering.
- **SOLID** — one service per concern (`IXpService`, `IBadgeService`, `ILeaderboardService`,
  `IMentorProgramService`), each depending on abstractions.
- **Configurable, not hard-coded** — all point values, badge thresholds, eligibility
  requirements, capacity and duration live in DB tables editable from the admin settings API.
- **EF Core best practice** — unique indexes for idempotency, projections for read models,
  `AsNoTracking` on reads, cascade config declared in `OnModelCreating`.
- **RBAC** — every admin endpoint is `[Authorize(Roles = "Admin")]`; member endpoints use
  `Alumni,Mentor`; the XP service is internal (never a public write endpoint).
- **OWASP / POPIA** — XP is never client-supplied (server awards it from trusted events);
  address/CV data is minimised and access-controlled; document upload uses a storage seam
  you point at private blob storage.

## Apply order (safe, incremental)

1. `01` entities + `AppDbContext` DbSets + `OnModelCreating` config.
2. `05` migration + seed (verify DB updates and existing rows are intact).
3. `02` + `03` services and the background completion worker.
4. `04` DTOs, controllers, DI registration.
5. Call `IXpService.AwardAsync(...)` from the existing services at the integration points
   listed in `02-services.md` (each call is a single line; nothing else changes).
6. `06` frontend wiring.

Each step builds and runs on its own; you can stop after any step and the app still works.
