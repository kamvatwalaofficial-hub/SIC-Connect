# SIC Connect

**An alumni networking and digital ecosystem platform for the Samsung Innovation Campus (SIC) programme.**

SIC Connect gives SIC graduates one place to stay connected after the programme: a searchable
alumni directory, career opportunities, events, mentorship, a project showcase and
announcements, with a recognition system that rewards community participation.

| | |
| --- | --- |
| **Frontend** | React 18 + Vite, Tailwind CSS, React Router, React Query, Axios |
| **Backend** | ASP.NET Core Web API (.NET 8), C#, Entity Framework Core 8, FluentValidation, Swagger |
| **Database** | Microsoft SQL Server |
| **Security** | Stateless JWT bearer auth, BCrypt password hashing, role-based access control |

---

## About this project

SIC Connect was built by a team from the Samsung Innovation Campus programme at Nelson Mandela
University. **Kamva Twala** served as **project manager**, leading the team from requirements and
UX design through to the working full-stack build:

- Coordinated scope, planning and delivery across the frontend, backend and database work
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

## Repository structure

```
.
├── backend/
│   └── SicConnect.Api/        ASP.NET Core Web API (see backend/README.md)
├── frontend/
│   └── sic-connect-web/       React + Vite single-page app (see frontend/README.md)
├── docs/
│   └── gamification/          Design notes for the recognition and mentor system
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
- GitHub Actions CI with build, test, dependency and secret scanning
- Containerised deployment to a cloud host with managed SQL and a secrets vault
- Blob storage for avatars and CV uploads; email and push notification delivery
- A full POPIA data-handling review before handling real alumni data

---

*Samsung and Samsung Innovation Campus are trademarks of Samsung Electronics. This is a
student project and is not an official Samsung product.*
