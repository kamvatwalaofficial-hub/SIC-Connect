import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/EmptyState.jsx';
import { Badge } from '../../components/Badge.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { LeaderboardPanel } from '../../components/LeaderboardPanel.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, formatDateTime } from '../../lib/constants.js';
import { useConnections, useRespondConnection, useRemoveConnection } from '../networking/api.js';
import { useEvents } from '../events/api.js';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Avatar({ name }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
      {initials(name) || '🎓'}
    </div>
  );
}

export function MentorDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useConnections();
  const events = useEvents();
  const respond = useRespondConnection();
  const remove = useRemoveConnection();

  if (isLoading) return <Spinner label="Loading your mentoring dashboard…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const mentorship = (data || []).filter((c) => c.type === 'Mentorship');
  const pending = mentorship.filter((c) => c.isIncoming && c.status === 'Pending');
  const mentees = mentorship.filter((c) => c.status === 'Accepted');
  const upcoming = (events.data || []).filter((e) => new Date(e.startsAt) >= new Date()).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0] || 'Mentor'} 👋`}
        subtitle="Your mentoring hub — requests, mentees, and upcoming sessions."
        actions={<Badge tone="amber">Mentor</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={pending.length} icon="📥" />
        <StatCard label="Active mentees" value={mentees.length} icon="🎓" />
        <StatCard label="Upcoming events" value={upcoming.length} icon="📅" />
      </div>

      {/* Mentorship requests */}
      <section className="card p-5">
        <h2 className="mb-1 font-semibold text-slate-900">Mentorship requests</h2>
        <p className="mb-4 text-sm text-slate-500">Alumni who’ve asked you to mentor them.</p>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">No pending requests right now.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={c.counterpartName} />
                  <div>
                    <div className="font-semibold text-slate-900">{c.counterpartName}</div>
                    <div className="text-sm text-slate-500">{c.counterpartHeadline || 'Alumnus'}</div>
                    {c.message && <p className="mt-1 text-sm italic text-slate-600">“{c.message}”</p>}
                    <div className="text-xs text-slate-400">Requested {formatDate(c.createdAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => respond.mutate({ id: c.id, accept: true })} disabled={respond.isPending} type="button">
                    Accept
                  </button>
                  <button className="btn-secondary" onClick={() => respond.mutate({ id: c.id, accept: false })} disabled={respond.isPending} type="button">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Active mentees */}
        <section className="card p-5">
          <h2 className="mb-1 font-semibold text-slate-900">Active mentees</h2>
          <p className="mb-4 text-sm text-slate-500">Alumni you’re currently mentoring.</p>
          {mentees.length === 0 ? (
            <EmptyState title="No active mentees yet" message="Accepted mentorship requests will appear here." />
          ) : (
            <div className="space-y-3">
              {mentees.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.counterpartName} />
                    <div>
                      <div className="font-medium text-slate-900">{c.counterpartName}</div>
                      <div className="text-xs text-slate-500">{c.counterpartHeadline || 'Alumnus'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/messages?to=${c.counterpartUserId}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                      Message
                    </Link>
                    <Badge tone="green">Active</Badge>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => remove.mutate(c.id)} type="button">
                      End
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming events */}
        <section className="card flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Upcoming events</h2>
            <Link to="/events" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{e.title}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(e.startsAt)}</div>
                  </div>
                  {e.isRegistered && <Badge tone="green">Going</Badge>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mentor recognition leaderboard (mentors only, with your rank). */}
        <LeaderboardPanel board="mentor" />
      </div>
    </div>
  );
}
