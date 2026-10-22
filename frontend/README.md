# SIC Connect — Frontend (React SPA)

React + Vite single-page app for SIC Connect. Feature-first structure: each pillar owns a
folder with its pages and API hooks. Tailwind handles styling, React Query owns server
state, and a small auth context holds the JWT and current user.

## Structure

```
sic-connect-web/
├── src/
│   ├── app/            App shell, route table (+ role guards), providers
│   ├── lib/            Axios client (JWT interceptor), query keys, constants
│   ├── context/        AuthContext (token, user, login/logout)
│   ├── components/     Shared UI (Field, Badge, Spinner, StatCard, guards…)
│   ├── layouts/        AppLayout (sidebar shell), AuthLayout
│   ├── hooks/          Cross-feature hooks (useDebounce)
│   └── features/       auth · dashboard · profile · directory · networking ·
│                       opportunities · applications · events · projects ·
│                       announcements · notifications · admin · analytics
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

Each feature folder exposes an `api.js` of React Query hooks and one or more pages that
consume them. Server state is fetched/cached with React Query; mutations invalidate the
relevant keys.

## Prerequisites

- Node.js 20+

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base URL. Default `/api` uses the Vite dev proxy; set an absolute URL to call the API directly. |
| `VITE_API_PROXY_TARGET` | Where the dev proxy forwards `/api` (default `http://localhost:5000`). |

## Demo mode (static, no backend)

The app can also be built as a self-contained demo that answers every API call from an
in-browser mock with fictional sample data (`src/demo/`). This is what powers the live demo
on GitHub Pages.

```bash
npm run build:demo     # builds with .env.demo (VITE_DEMO=true, VITE_BASE=/SIC-Connect/)
npm run preview:demo   # serves it at http://localhost:4173/SIC-Connect/
npm run test:demo      # runs the demo API test suite
```

Demo state is stored per visitor in `localStorage` and can be reset from the banner. A normal
`npm run build` excludes all demo code.

## Run

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint       # ESLint
```

Make sure the backend API is running (see `../backend/README.md`) and its CORS
`AllowedOrigins` includes `http://localhost:5173`.

## Auth flow

1. `AuthContext.login/register` POSTs to `/api/auth/*` and stores the JWT (localStorage).
2. The Axios request interceptor attaches `Authorization: Bearer <token>` to every call.
3. A `401` response clears the token and returns the user to `/login`.
4. `<RequireAuth>` / `<RequireRole roles={['Admin']}>` guard the routes by JWT role.

Use the seeded development accounts (see `../backend/README.md`) to sign in, e.g. the admin
account to see the Admin Console and Analytics dashboard.

## Navigation & UX

- **Grouped sidebar** (Community · Grow · Updates · Administration) with active-state
  highlighting, collapsible on mobile with a backdrop and auto-close on navigation.
- **Header**: breadcrumbs, a live **notification bell** with unread badge, the current user
  and role, and sign-out.
- **Consistent page pattern**: every page uses `PageHeader`, loading `Spinner`, `EmptyState`
  and `ErrorState`, so the app feels uniform and predictable.
- **The two AI features** surface inline: recommended opportunities on the Opportunities page
  and networking suggestions on the Networking page, each showing the reasons behind the match.
