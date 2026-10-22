# 06 — Frontend integration

The Part-A commit already added the reusable primitives this layer needs:
`components/SkillSelect.jsx`, `components/SkillChips.jsx`, `components/SocialLinks.jsx`,
`components/CelebrationModal.jsx`, and `lib/skillsCatalog.js`. This file wires them (plus a
few new components) to the recognition API. All hooks follow the existing
`@tanstack/react-query` + `apiClient` pattern.

## API hooks — `features/recognition/api.js`

```js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';

export const useMyRecognition = () => useQuery({
  queryKey: ['recognition', 'me'],
  queryFn: async () => (await apiClient.get('/recognition/me')).data,
});
export const useLeaderboard = (scope) => useQuery({
  queryKey: ['recognition', 'leaderboard', scope],
  queryFn: async () => (await apiClient.get(`/recognition/leaderboard?scope=${scope}`)).data,
});
export const usePendingCelebrations = () => useQuery({
  queryKey: ['recognition', 'celebrations'],
  queryFn: async () => (await apiClient.get('/recognition/celebrations')).data,
  refetchInterval: 60_000,
});
export function useMarkCelebrated() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => apiClient.post('/recognition/celebrations/seen', ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recognition', 'celebrations'] }),
  });
}

// Mentor programme
export const useMentorEligibility = () => useQuery({
  queryKey: ['mentor', 'eligibility'],
  queryFn: async () => (await apiClient.get('/mentor-program/eligibility')).data,
});
export function useApplyMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/mentor-program/apply', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor', 'eligibility'] }),
  });
}
export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (available) => apiClient.put('/mentor-program/availability', available),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'me'] }),
  });
}
```

## Leaderboard panel (Alumni & Mentor dashboards, right-hand side)

`features/recognition/LeaderboardPanel.jsx` — Top 10, with the logged-in user highlighted,
and a separator + "You are ranked #N" row when the user is outside the Top 10.

```jsx
export function LeaderboardPanel({ scope = 'Alumni' }) {
  const { data, isLoading } = useLeaderboard(scope);
  if (isLoading || !data) return <div className="card p-5">Loading leaderboard…</div>;
  const Row = ({ r, me }) => (
    <li className={`flex items-center gap-3 rounded-lg px-2 py-2 ${me ? 'bg-brand-50 ring-1 ring-brand-200' : ''}`}>
      <span className={`w-6 text-center text-sm font-bold ${r.rank <= 3 ? 'text-brand-600' : 'text-slate-400'}`}>#{r.rank}</span>
      <Avatar name={r.fullName} url={r.avatarUrl} />
      <span className="flex-1 truncate text-sm font-medium text-slate-800">{r.fullName}{me && ' (You)'}</span>
      <span className="text-sm font-bold text-slate-900">{r.totalXp.toLocaleString()} XP</span>
    </li>
  );
  return (
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{scope} Leaderboard · Top 10</h3>
      <ul className="space-y-1">
        {data.top.map((r) => <Row key={r.userId} r={r} me={data.self == null && r /* highlight when in top */ && r.userId === window.__meId} />)}
      </ul>
      {data.self && (
        <>
          <div className="my-2 flex items-center gap-2 text-xs text-slate-300"><span className="h-px flex-1 bg-slate-200" />•••<span className="h-px flex-1 bg-slate-200" /></div>
          <ul><Row r={data.self} me /></ul>
        </>
      )}
    </div>
  );
}
```

Place it in the right column of both dashboards:
```jsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">{/* existing dashboard content */}</div>
  <div className="lg:col-span-1"><LeaderboardPanel scope={role === 'Mentor' ? 'Mentor' : 'Alumni'} /></div>
</div>
```

## Celebration wiring (two triggers, non-intrusive)

1. **Immediate** — mutations that award XP return `XpAwardResult`; when
   `unlockedBadges.length` or `pointsAwarded > 0`, open `CelebrationModal`:
   ```jsx
   const [celebration, setCelebration] = useState(null);
   // in a mutation onSuccess: setCelebration({ xp: res.pointsAwarded, badge: res.unlockedBadges[0] });
   <CelebrationModal open={!!celebration} onClose={() => setCelebration(null)} {...celebration} />
   ```
2. **Server-driven** — a small `CelebrationHost` mounted in `AppLayout` polls
   `usePendingCelebrations()`, shows them one at a time, then calls `useMarkCelebrated()` so
   they never repeat (covers milestones reached by the background worker, e.g. mentorship
   completion). Queue them so celebrations are sequential, not stacked.

## Mentor eligibility UI (replaces the mentorship checkbox on the profile)

In `ProfilePage.jsx`, swap the "I’m available as a mentor" checkbox card for:

```jsx
function MentorSection() {
  const { data: elig } = useMentorEligibility();
  const apply = useApplyMentor();
  if (!elig) return null;
  if (elig.alreadyMentor) return <AvailabilityToggle />;              // approved → show switch
  if (elig.applicationPending) return <Badge tone="amber">Mentor application under review</Badge>;
  return (
    <div className="card space-y-3 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Become a Mentor</h3>
      <ul className="space-y-1.5">
        {elig.requirements.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-sm">
            <span className={r.met ? 'text-emerald-600' : 'text-slate-300'}>{r.met ? '✓' : '○'}</span>
            <span className={r.met ? 'text-slate-700' : 'text-slate-500'}>{r.label} <span className="text-xs text-slate-400">· {r.detail}</span></span>
          </li>
        ))}
      </ul>
      {elig.eligible
        ? <button className="btn-primary w-full" onClick={() => apply.mutate({ motivation: '' })}>Apply to Become a Mentor</button>
        : <p className="text-xs text-slate-400">Complete the remaining requirements to unlock your mentor application.</p>}
    </div>
  );
}
```

`AvailabilityToggle` renders a switch bound to `useSetAvailability()`, labelled
**"Available to Mentor"**, and shows capacity ("2 / 3 active mentees · at full capacity"
when `activeMentees >= maxMentees`).

## Professional profile fields

Add the atomic address inputs (Street, Suburb, City, Province, Postal code, Country), a Cohort
**dropdown** (year list), Programme, First/Surname and Occupation to the profile form — all map
to the new `UpdateProfileDto` fields (which remain optional, preserving the existing single
`fullName`/`location` for anyone who hasn't split them). Skills already use `SkillSelect`.

CV + certification **uploads**: add a file input that POSTs `multipart/form-data` to a new
`POST /api/profiles/documents` (returns a `ProfileDocument`); list documents with download
links and a remove action. Point the controller at private blob storage (Azure Blob / S3);
never serve documents from a public path (POPIA).

## Social buttons everywhere an alumnus appears

Use `<SocialLinks linkedInUrl={x.linkedInUrl} gitHubUrl={x.gitHubUrl} size="sm" />` on:
- the profile page (done in Part A),
- directory result cards, community page, connection cards, search results — once
  `DirectoryItemDto` / connection DTOs carry `linkedInUrl`/`gitHubUrl` (add to the projections,
  §04). The component hides itself when both are absent, so no empty placeholders.
- a public profile route `/@:userId` (or `/profiles/:userId`) backed by `GET /api/profiles/{userId}`.

## Admin: Recognition settings + analytics page

New admin route `/admin/recognition` with tabs:
- **Settings** — form bound to `GET/PUT /api/admin/recognition/settings` (mentor min XP,
  verified/complete-profile toggles, max mentees, duration days, completion XP).
- **XP values** — editable table (`/api/admin/recognition/xp-config`).
- **Badges** — CRUD table (`/api/admin/recognition/badges`) with rarity/threshold/reward.
- **Skills** — catalogue add/disable (`/api/admin/recognition/skills`).
- **Analytics** — cards + charts from `/api/admin/recognition/analytics` (total XP awarded,
  badges unlocked, most active users, most-earned badges, mentorship completion rate, XP by
  month). Reuse the existing dashboard chart components.

Add the nav entry to `ADMIN_NAV` in `lib/navigation.js`:
`{ to: '/admin/recognition', label: 'Recognition', icon: '🏅' }` (or the One UI `star` icon
if the icon-set port is merged).

## Order to build the frontend

1. `recognition/api.js` + `LeaderboardPanel` → drop into both dashboards.
2. Badges already render on the profile (Part A) once `/recognition/me` / `profiles/me`
   returns `badges`; also add a compact badge strip to the dashboards.
3. `CelebrationHost` in `AppLayout` + immediate celebration on XP-awarding mutations.
4. Mentor eligibility/availability section on the profile.
5. Atomic address + Cohort dropdown + uploads on the profile.
6. Admin recognition settings/analytics page.
