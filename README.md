# SIC Connect

**An alumni networking and digital ecosystem platform for the Samsung Innovation Campus (SIC) programme.**

SIC Connect gives SIC graduates one place to stay connected after the programme: a searchable
alumni directory, career opportunities, events, mentorship, a project showcase and
announcements, with a recognition system that rewards community participation.

### ▶ [Try the live demo](https://kamvatwala.com/SIC-Connect/)

Sign in with one click as an **Alumni**, **Mentor** or **Admin** user. The demo runs entirely in
your browser with fictional sample data, so you can apply for opportunities, message
connections, register for events and approve accounts without affecting anyone else.

| | |
| --- | --- |
| **Frontend** | React 18 + Vite, Tailwind CSS, React Router, React Query, Axios |
| **Backend** | ASP.NET Core Web API (.NET 8), C#, Entity Framework Core 8, FluentValidation, Swagger |
| **Database** | Microsoft SQL Server |
| **Security** | Stateless JWT bearer auth, BCrypt password hashing, role-based access control |

---

## About this project

🥈 **Second place overall in the Samsung Innovation Campus hackathon (July 2026).**

SIC Connect was built in **one week** by a team from the Samsung Innovation Campus programme at
Nelson Mandela University. The brief was to create an alumni system that lets everyone who has
been through the programme stay connected with one another, access opportunities, and showcase
their career progress and the skills they gained. The team pitched the solution to Samsung and
industry experts on 24 July 2026 and placed second overall.

**Kamva Twala** served as **project manager and team leader**, leading the team from requirements
and UX design through to the working full-stack build and the final pitch:

- Led the team and coordinated scope, planning and delivery across the frontend, backend and
  database work within the one-week deadline
- Pitched the solution to a panel of Samsung and industry experts
- Led the UX design: 12 high-fidelity screens and an interactive prototype following Samsung's
  One UI principles
- Defined the fixed technology stack and the three-tier architecture
- Prepared this public version of the codebase, removing secrets and personal data and moving
  configuration to user-secrets and environment variables

---

## Features

| Module | What it does |
| --- | --- |
| Secure authentication | Register and log in with JWT; roles for Alumni, Mentor and Admin; admin approval queue for new accounts |
| Alumni profiles | Skills, certifications, projects, employment status, CV and portfolio links |
| Community directory | Search and filter alumni by skill, cohort, location, industry and employment status |
| Opportunities hub | Jobs, internships, graduate programmes, hackathons and scholarships, with in-app applications |
| Events | Admins publish events; alumni browse and register |
| Project showcase | Projects with tech stack, GitHub and demo links |
| Networking and messaging | Peer connections, mentorship requests and direct messages |
| Mentorship workflow | Mentor eligibility, applications, admin approval, capacity limits and availability |
| Recognition | XP for community activity, badges and Alumni / Mentor leaderboards |
| Notifications and announcements | In-app notifications and platform-wide announcements |
| Admin and analytics dashboards | User management, content publishing and engagement metrics |
| Recommendations | Explainable heuristics that suggest relevant opportunities and people to connect with |

The two recommendation features use transparent, rule-based scoring (no external AI model), and
show users the reasons behind each suggestion.

---

## Live demo and deployment pipeline

The [live demo](https://kamvatwala.com/SIC-Connect/) is the real React frontend, built in a
special **demo mode** and hosted free on GitHub Pages:

- **No backend needed.** In demo mode the Axios client answers every API call from an
  in-browser mock (`frontend/sic-connect-web/src/demo/`) that mirrors the ASP.NET Core API's
  routes, response shapes, permission checks and scoring rules, using the same fictional
  people as the backend's database seeder.
- **Private per visitor.** Changes are saved in the visitor's own browser storage and can be
  reset from the banner. Nothing is sent to a server.
- **Not in production builds.** The demo code loads only when built with `npm run build:demo`;
  a normal `npm run build` contains none of it.

Every push to `main` that changes the frontend runs the
[Deploy live demo](.github/workflows/deploy-demo.yml) GitHub Actions workflow:

1. Installs dependencies from the lockfile (`npm ci`)
2. **Audits dependencies** and fails the build on any high-severity vulnerability
3. Runs the demo API test suite (80 checks covering every endpoint, permissions and workflows)
4. Builds the demo and deploys it to GitHub Pages with least-privilege permissions

Every pull request and push to `main` also runs the [CI](.github/workflows/ci.yml) workflow, which
builds the .NET backend and the React frontend and fails on high-severity vulnerabilities in either
NuGet or npm packages.

[Dependabot](.github/dependabot.yml) checks npm, NuGet and GitHub Actions dependencies weekly
(Actions monthly) and opens grouped pull requests, which CI tests before they are merged.

---

## Repository structure

```
.
├── backend/
│   └── SicConnect.Api/        ASP.NET Core Web API (see backend/README.md)
├── frontend/
│   └── sic-connect-web/       React + Vite single-page app (see frontend/README.md)
├── docs/
│   └── gamification/          Design notes for the recognition and mentor system
├── .github/
│   ├── workflows/             CI (build + audit) and live-demo deployment
│   └── dependabot.yml         weekly dependency updates
├── .gitignore
└── README.md
```

---

## Getting started

### 1. Backend (API + Swagger)

Requires the **.NET 8 SDK** and a **SQL Server** instance (LocalDB, Express or Docker).

```bash
cd backend/SicConnect.Api
dotnet restore
dotnet user-secrets init
dotnet user-secrets set "Jwt:Secret" "<a random string of at least 32 characters>"
# Optional, if you are not using a local SQL Express instance:
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your connection string>"

dotnet tool install --global dotnet-ef        # once
dotnet ef database update                     # applies the included migrations
dotnet run                                    # serves the API and Swagger UI
```

Swagger UI is served at `https://localhost:5001/swagger`. In Development, the API seeds
fictional demo accounts and sample data; see [backend/README.md](backend/README.md) for the
demo logins.

### 2. Frontend

Requires **Node.js 20+**.

```bash
cd frontend/sic-connect-web
cp .env.example .env
npm install
npm run dev                                   # http://localhost:5173
```

---

## Security notes

- **No secrets in source control.** The JWT signing key and connection string are supplied
  through .NET user-secrets locally, or environment variables in a hosted environment.
  The API refuses to start without a signing key of at least 32 characters.
- **Passwords** are hashed with BCrypt, never stored in plain text.
- **Role-based authorisation** is enforced on the API, not just hidden in the UI.
- **Demo data is Development-only** and uses fictional people on the reserved `.example`
  domain, so no real person's details are included.
- `.env`, local settings files and certificates are excluded by `.gitignore`.
- **Dependencies are audited in CI** (npm and NuGet), and deployment is blocked by high-severity vulnerabilities.
- **Dependabot** keeps dependencies patched, with every upgrade tested by CI before merging.

---

## API overview

Base path `/api`, JSON in and out, JWT bearer auth, fully documented in Swagger.

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | Public |
| GET / PUT | `/api/profiles/me` | Authenticated |
| GET | `/api/directory?skill=&cohort=&q=` | Authenticated |
| GET / POST | `/api/opportunities` | Authenticated / Admin |
| GET | `/api/opportunities/recommendations` | Authenticated |
| POST | `/api/opportunities/{id}/apply` | Authenticated |
| GET / POST | `/api/events`, `/api/events/{id}/register` | Authenticated |
| GET / POST | `/api/projects` | Authenticated |
| GET / POST | `/api/networking/connections` | Authenticated |
| GET | `/api/networking/suggestions` | Authenticated |
| GET / POST | `/api/messages/conversations`, `/api/messages/{userId}` | Authenticated |
| GET | `/api/leaderboard` | Authenticated |
| GET | `/api/notifications` | Authenticated |
| GET / POST | `/api/announcements` | Authenticated / Admin |
| GET | `/api/analytics/summary` | Admin |

See [backend/README.md](backend/README.md) for the full endpoint reference.

---

## Possible next steps

- Refresh-token rotation and rate limiting on authentication endpoints
- Add backend unit tests, secret scanning and static analysis (CodeQL) to CI
- Upgrade to React Router 7 to clear two moderate-severity advisories that do not affect this app's usage
- Containerised deployment to a cloud host with managed SQL and a secrets vault
- Blob storage for avatars and CV uploads; email and push notification delivery
- A full POPIA data-handling review before handling real alumni data

---

*Samsung and Samsung Innovation Campus are trademarks of Samsung Electronics. This is a
student project and is not an official Samsung product.*
