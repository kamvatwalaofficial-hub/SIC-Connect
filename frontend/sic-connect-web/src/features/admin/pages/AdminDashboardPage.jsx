import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Donut } from '../../../components/charts/Donut.jsx';
import { Legend } from '../../../components/charts/Legend.jsx';
import { LineArea } from '../../../components/charts/LineArea.jsx';
import { Bars } from '../../../components/charts/Bars.jsx';
import { HBars } from '../../../components/charts/HBars.jsx';
import { colorAt } from '../../../components/charts/palette.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { EMPLOYMENT_STATUS, OPPORTUNITY_TYPES, formatDateTime, formatRelative, labelFor } from '../../../lib/constants.js';
import { useAdminDashboard } from '../../analytics/api.js';
import { UsersManagementSection } from '../UsersManagementSection.jsx';

const ENGAGEMENT_COLORS = {
  'Active Alumni': '#1428a0',
  'Job Seeking': '#f59e0b',
  Employed: '#16a34a',
  Mentors: '#7c3aed',
  'Inactive Members': '#94a3b8',
};

const KPIS = [
  { key: 'totalAlumni', label: 'Total Registered Alumni', subtitle: 'across all cohorts', icon: '🎓', tone: 'bg-brand-50 text-brand-600', to: '/directory' },
  { key: 'activeOpportunities', label: 'Active Opportunities', subtitle: 'open right now', icon: '💼', tone: 'bg-emerald-50 text-emerald-600', to: '/opportunities' },
  { key: 'upcomingEvents', label: 'Upcoming Events', subtitle: 'scheduled ahead', icon: '📅', tone: 'bg-amber-50 text-amber-600', to: '/events' },
  { key: 'newRegistrationsThisMonth', label: 'New Registrations', subtitle: 'this month', icon: '📈', tone: 'bg-purple-50 text-purple-600', to: '/directory' },
];

const ACTIVITY_ICON = {
  registration: '🎓',
  opportunity: '💼',
  event: '📅',
  announcement: '📢',
  profile: '👤',
};

function KpiCard({ icon, tone, value, label, subtitle, to }) {
  return (
    <Link
      to={to}
      className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${tone}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
    </Link>
  );
}

function Panel({ title, subtitle, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function capacityTone(pct) {
  if (pct >= 90) return '#ef4444';
  if (pct >= 60) return '#f59e0b';
  return '#16a34a';
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useAdminDashboard();

  if (isLoading) return <Spinner label="Building your dashboard…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const engagement = data.engagement.map((e) => ({ ...e, value: e.count, color: ENGAGEMENT_COLORS[e.label] || '#94a3b8' }));
  const employment = data.employmentStatusDistribution.map((e, i) => ({
    label: labelFor(EMPLOYMENT_STATUS, e.label),
    value: e.count,
    color: colorAt(i),
  }));
  const topSkills = data.topSkills.map((s) => ({ label: s.label, value: s.count }));
  const engagementTotal = engagement.reduce((s, e) => s + e.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Administrator'} 👋`}
        subtitle="A complete overview of alumni engagement, opportunities, events and community growth."
        actions={<Badge tone="purple">Administrator</Badge>}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <KpiCard key={k.key} {...k} value={data.kpis[k.key]} />
        ))}
      </div>

      {/* Account approval queue callout */}
      {data.pendingApprovals > 0 && (
        <Link
          to="/approvals"
          className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-xl">⏳</span>
            <div>
              <div className="font-semibold text-amber-900">
                {data.pendingApprovals} account{data.pendingApprovals > 1 ? 's' : ''} awaiting approval
              </div>
              <div className="text-sm text-amber-700">Review new registrations in the Account Approval Queue.</div>
            </div>
          </div>
          <span className="text-sm font-semibold text-amber-800">Review now →</span>
        </Link>
      )}

      {/* Engagement + Opportunities/Events */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Community Engagement Overview" subtitle="How alumni are participating across the platform">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <Donut data={engagement} centerLabel="Total alumni" />
            <div className="flex-1">
              <Legend items={engagement} total={engagementTotal} />
              <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Total registered alumni: </span>
                <span className="font-semibold text-slate-900">{data.totalAlumni}</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Opportunities & Events Overview" subtitle="Available opportunities and upcoming events">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Available opportunities</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {data.opportunitiesByType.map((o, i) => (
                <div key={o.label} className="rounded-lg border border-slate-100 p-3">
                  <div className="text-lg font-bold text-slate-900">{o.count}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorAt(i) }} />
                    {labelFor(OPPORTUNITY_TYPES, o.label)}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Upcoming events</h3>
            <div className="space-y-3">
              {data.upcomingEvents.length === 0 && <p className="text-sm text-slate-400">No upcoming events.</p>}
              {data.upcomingEvents.map((e) => {
                const pct = e.capacity ? Math.min(100, Math.round((e.attendeeCount / e.capacity) * 100)) : null;
                return (
                  <div key={e.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-800">{e.title}</span>
                      {e.isOnline ? <Badge tone="brand">Online</Badge> : <Badge tone="slate">In person</Badge>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                      <span>🗓️ {formatDateTime(e.startsAt)}</span>
                      {e.venue && <span>📍 {e.venue}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct ?? 15}%`, backgroundColor: pct == null ? '#94a3b8' : capacityTone(pct) }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {e.attendeeCount}{e.capacity ? ` / ${e.capacity}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Alumni registrations over time" subtitle="New sign-ups per month">
          <LineArea data={data.registrationsOverTime.map((p) => ({ label: p.label, value: p.value }))} color="#1428a0" />
        </Panel>
        <Panel title="Opportunities posted per month">
          <Bars data={data.opportunitiesPerMonth.map((p) => ({ label: p.label, value: p.value }))} color="#3355f0" />
        </Panel>
        <Panel title="Event attendance trends" subtitle="Registrations per month">
          <LineArea data={data.eventAttendanceOverTime.map((p) => ({ label: p.label, value: p.value }))} color="#16a34a" />
        </Panel>
        <Panel title="Top skills among alumni">
          <HBars data={topSkills} color="#7c3aed" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Employment status distribution" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-4">
            <Donut data={employment} centerLabel="Alumni" />
            <Legend items={employment} total={employment.reduce((s, e) => s + e.value, 0)} />
          </div>
        </Panel>

        <Panel title="Recent activity" subtitle="Latest actions across the platform" className="lg:col-span-2">
          <ul className="space-y-1">
            {data.recentActivity.length === 0 && <p className="text-sm text-slate-400">No recent activity.</p>}
            {data.recentActivity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-base">
                  {ACTIVITY_ICON[a.type] || '•'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-700">{a.title}</p>
                  {a.actor && <p className="truncate text-xs text-slate-400">{a.actor}</p>}
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">{formatRelative(a.timestamp)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Mentorship overview + mentor workload */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Mentorship overview" subtitle="Requests and active relationships across the platform">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Pending requests', value: data.mentorshipStats.pendingRequests, tone: 'bg-amber-50 text-amber-700' },
              { label: 'Active mentorships', value: data.mentorshipStats.activeMentorships, tone: 'bg-emerald-50 text-emerald-700' },
              { label: 'Declined', value: data.mentorshipStats.declinedRequests, tone: 'bg-slate-100 text-slate-600' },
              { label: 'Total mentors', value: data.mentorshipStats.totalMentors, tone: 'bg-purple-50 text-purple-700' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-100 p-4">
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}>{s.label}</div>
              </div>
            ))}
          </div>
          <Link to="/mentorships" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
            Manage mentorships →
          </Link>
        </Panel>

        <Panel title="Mentor workload" subtitle="Active mentees per mentor">
          {data.mentorWorkload.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No mentors yet.</p>
          ) : (
            <HBars
              data={data.mentorWorkload.map((m) => ({ label: m.mentorName, value: m.activeMentees }))}
              color="#7c3aed"
            />
          )}
        </Panel>
      </div>

      {/* User management (Admin Console, merged into the dashboard) */}
      <UsersManagementSection />
    </div>
  );
}
