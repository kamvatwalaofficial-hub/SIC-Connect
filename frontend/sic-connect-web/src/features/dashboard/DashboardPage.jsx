import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Badge } from '../../components/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { CONNECTION_STATUS, formatDate, formatDateTime, labelFor, OPPORTUNITY_TYPES, toneFor } from '../../lib/constants.js';
import { useAnnouncements } from '../announcements/api.js';
import { useEvents } from '../events/api.js';
import { useOpportunities } from '../opportunities/api.js';
import { useConnections } from '../networking/api.js';
import { LeaderboardPanel } from '../../components/LeaderboardPanel.jsx';
import { AdminDashboardPage } from '../admin/pages/AdminDashboardPage.jsx';
import { MentorDashboardPage } from '../mentor/MentorDashboardPage.jsx';

/** Dashboard is role-aware: admins, mentors and alumni each get a purpose-built view. */
export function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'Admin') return <AdminDashboardPage />;
  if (user?.role === 'Mentor') return <MentorDashboardPage />;
  return <AlumniDashboard />;
}

function SectionCard({ title, to, linkLabel = 'View all', children }) {
  return (
    <div className="card flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <Link to={to} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          {linkLabel} →
        </Link>
      </div>
      <div className="flex-1 space-y-3">{children}</div>
    </div>
  );
}

function AlumniDashboard() {
  const { user } = useAuth();
  const announcements = useAnnouncements();
  const events = useEvents();
  const opportunities = useOpportunities();

  const connections = useConnections();

  const latestAnnouncements = (announcements.data || []).slice(0, 3);
  const upcomingEvents = (events.data || [])
    .filter((e) => new Date(e.endsAt || e.startsAt) >= new Date())
    .slice(0, 3);
  const latestOpportunities = (opportunities.data || []).slice(0, 4);
  const myMentorshipRequests = (connections.data || [])
    .filter((c) => c.type === 'Mentorship' && !c.isIncoming)
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0] || 'there'} 👋`}
        subtitle="Here’s what’s happening across the SIC community."
      />

      <div className="mb-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 p-6 text-white">
        <h2 className="text-lg font-semibold">Make the most of SIC Connect</h2>
        <p className="mt-1 max-w-2xl text-sm text-brand-100">
          Complete your profile, explore the directory, register for events, and showcase your
          projects to stand out to Samsung and the alumni network.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/profile" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Complete your profile
          </Link>
          <Link to="/networking" className="btn border border-white/60 text-white hover:bg-white/10">
            Find mentors & connections
          </Link>
          <Link to="/opportunities" className="btn border border-white/60 text-white hover:bg-white/10">
            See recommended opportunities
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SectionCard title="Announcements" to="/announcements">
              {announcements.isLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : latestAnnouncements.length === 0 ? (
                <p className="text-sm text-slate-400">No announcements yet.</p>
              ) : (
                latestAnnouncements.map((a) => (
                  <div key={a.id} className="border-l-2 border-brand-200 pl-3">
                    <div className="text-sm font-medium text-slate-800">{a.title}</div>
                    <div className="text-xs text-slate-400">{formatDate(a.publishedAt)}</div>
                  </div>
                ))
              )}
            </SectionCard>

            <SectionCard title="Upcoming events" to="/events">
              {events.isLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-slate-400">No events scheduled.</p>
              ) : (
                upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{e.title}</div>
                      <div className="text-xs text-slate-400">{formatDateTime(e.startsAt)}</div>
                    </div>
                    {e.isRegistered && <Badge tone="green">Going</Badge>}
                  </div>
                ))
              )}
            </SectionCard>

            <SectionCard title="Latest opportunities" to="/opportunities">
              {opportunities.isLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : latestOpportunities.length === 0 ? (
                <p className="text-sm text-slate-400">No opportunities yet.</p>
              ) : (
                latestOpportunities.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{o.title}</div>
                      <div className="truncate text-xs text-slate-400">{o.organisation}</div>
                    </div>
                    <Badge tone="brand">{labelFor(OPPORTUNITY_TYPES, o.type)}</Badge>
                  </div>
                ))
              )}
            </SectionCard>

            <SectionCard title="My mentorship requests" to="/networking" linkLabel="Find mentors">
              {connections.isLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : myMentorshipRequests.length === 0 ? (
                <p className="text-sm text-slate-400">
                  You haven’t requested a mentor yet. Browse mentors to send a request.
                </p>
              ) : (
                myMentorshipRequests.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{c.counterpartName}</div>
                      <div className="truncate text-xs text-slate-400">{c.counterpartHeadline || 'Mentor'}</div>
                    </div>
                    <Badge tone={toneFor(CONNECTION_STATUS, c.status)}>{labelFor(CONNECTION_STATUS, c.status)}</Badge>
                  </div>
                ))
              )}
            </SectionCard>
          </div>
        </div>

        {/* Right rail: alumni recognition leaderboard (alumni only, with your rank). */}
        <div className="space-y-4">
          <LeaderboardPanel board="alumni" />
        </div>
      </div>
    </div>
  );
}
