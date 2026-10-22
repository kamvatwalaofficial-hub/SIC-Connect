import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Tabs } from '../../../components/Tabs.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { CONNECTION_STATUS, CONNECTION_TYPE, labelFor, toneFor } from '../../../lib/constants.js';
import {
  useConnections,
  useRemoveConnection,
  useRequestConnection,
  useRespondConnection,
  useSuggestions,
} from '../api.js';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Avatar({ name }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
      {initials(name) || '👤'}
    </div>
  );
}

/** A person row that links straight to their conversation in Messages. */
function PersonMessageRow({ connection, onRemove }) {
  return (
    <Link
      to={`/messages?to=${connection.counterpartUserId}`}
      className="card flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <Avatar name={connection.counterpartName} />
        <div>
          <div className="font-semibold text-slate-900">{connection.counterpartName}</div>
          <div className="text-sm text-slate-500">{connection.counterpartHeadline || '—'}</div>
          <div className="mt-1 flex gap-1.5">
            <Badge tone={toneFor(CONNECTION_TYPE, connection.type)}>{labelFor(CONNECTION_TYPE, connection.type)}</Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-brand-600">Message →</span>
        {onRemove && (
          <button
            className="text-xs text-red-600 hover:underline"
            onClick={(e) => { e.preventDefault(); onRemove(connection.id); }}
            type="button"
          >
            Remove
          </button>
        )}
      </div>
    </Link>
  );
}

// ---------- Mentor tabs ----------

function MentorMenteesTab({ connections }) {
  const remove = useRemoveConnection();
  const mentees = connections.filter((c) => c.type === 'Mentorship' && c.status === 'Accepted' && c.isIncoming);
  if (mentees.length === 0) {
    return <EmptyState title="No mentees yet" message="Accepted mentorship requests will appear here as active mentees." />;
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {mentees.map((c) => <PersonMessageRow key={c.id} connection={c} onRemove={(id) => remove.mutate(id)} />)}
    </div>
  );
}

function MentorRequestsTab({ connections }) {
  const respond = useRespondConnection();
  const requests = connections.filter((c) => c.type === 'Mentorship' && c.status === 'Pending' && c.isIncoming);
  if (requests.length === 0) {
    return <EmptyState title="No pending requests" message="Mentorship requests from alumni will appear here." />;
  }
  return (
    <div className="space-y-3">
      {requests.map((c) => (
        <div key={c.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={c.counterpartName} />
            <div>
              <div className="font-semibold text-slate-900">{c.counterpartName}</div>
              <div className="text-sm text-slate-500">{c.counterpartHeadline || 'Alumnus'}</div>
              {c.message && <p className="mt-1 text-sm italic text-slate-600">“{c.message}”</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => respond.mutate({ id: c.id, accept: true })} disabled={respond.isPending} type="button">Accept</button>
            <button className="btn-danger" onClick={() => respond.mutate({ id: c.id, accept: false })} disabled={respond.isPending} type="button">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MyNetworkTab({ connections }) {
  const remove = useRemoveConnection();
  const respond = useRespondConnection();

  // Incoming pending CONNECTION requests (mentorship requests live in the Requests tab).
  const pending = connections.filter((c) => c.type === 'Connection' && c.status === 'Pending' && c.isIncoming);
  const network = connections.filter((c) => c.status === 'Accepted');

  if (pending.length === 0 && network.length === 0) {
    return <EmptyState title="No connections yet" message="People you connect with will appear here." />;
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Connection requests ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((c) => (
              <div key={c.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={c.counterpartName} />
                  <div>
                    <div className="font-semibold text-slate-900">{c.counterpartName}</div>
                    <div className="text-sm text-slate-500">{c.counterpartHeadline || 'Wants to connect'}</div>
                    {c.message && <p className="mt-1 text-sm italic text-slate-600">“{c.message}”</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => respond.mutate({ id: c.id, accept: true })} disabled={respond.isPending} type="button">Accept</button>
                  <button className="btn-danger" onClick={() => respond.mutate({ id: c.id, accept: false })} disabled={respond.isPending} type="button">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {network.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">My network</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {network.map((c) => <PersonMessageRow key={c.id} connection={c} onRemove={(id) => remove.mutate(id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function MentorNetworking() {
  const { data, isLoading, isError, error, refetch } = useConnections();
  const [tab, setTab] = useState('mentees');

  if (isLoading) return <Spinner label="Loading your network…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  const connections = data || [];

  const menteeCount = connections.filter((c) => c.type === 'Mentorship' && c.status === 'Accepted' && c.isIncoming).length;
  const requestCount = connections.filter((c) => c.type === 'Mentorship' && c.status === 'Pending' && c.isIncoming).length;
  const pendingConnCount = connections.filter((c) => c.type === 'Connection' && c.status === 'Pending' && c.isIncoming).length;
  const networkCount = connections.filter((c) => c.status === 'Accepted').length + pendingConnCount;

  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'mentees', label: 'Mentees', count: menteeCount },
          { value: 'requests', label: 'Requests', count: requestCount },
          { value: 'network', label: 'My Network', count: networkCount },
        ]}
      />
      <div className="mt-6">
        {tab === 'mentees' && <MentorMenteesTab connections={connections} />}
        {tab === 'requests' && <MentorRequestsTab connections={connections} />}
        {tab === 'network' && <MyNetworkTab connections={connections} />}
      </div>
    </div>
  );
}

// ---------- Alumni tabs ----------

function ConnectionsTab() {
  const { data, isLoading, isError, error, refetch } = useConnections();
  const respond = useRespondConnection();
  const remove = useRemoveConnection();
  const request = useRequestConnection();

  if (isLoading) return <Spinner label="Loading your network…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const incoming = (data || []).filter((c) => c.isIncoming && c.status === 'Pending');
  const others = (data || []).filter((c) => !(c.isIncoming && c.status === 'Pending'));

  // Counterparts we already have a mentorship link with (any status) — hides the request button.
  const mentorshipWith = new Set((data || []).filter((c) => c.type === 'Mentorship').map((c) => c.counterpartUserId));
  const canRequestMentorship = (c) => c.counterpartIsMentor && !mentorshipWith.has(c.counterpartUserId);

  if ((data || []).length === 0) {
    return <EmptyState title="No connections yet" message="Check the Suggestions tab to find people to connect with." />;
  }

  return (
    <div className="space-y-6">
      {incoming.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pending requests ({incoming.length})
          </h3>
          <div className="space-y-3">
            {incoming.map((c) => (
              <div key={c.id} className="card flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={c.counterpartName} />
                  <div>
                    <div className="font-semibold text-slate-900">{c.counterpartName}</div>
                    <div className="text-sm text-slate-500">
                      <Badge tone={toneFor(CONNECTION_TYPE, c.type)}>{labelFor(CONNECTION_TYPE, c.type)}</Badge>
                      {c.message && <span className="ml-2 italic">“{c.message}”</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => respond.mutate({ id: c.id, accept: true })} disabled={respond.isPending} type="button">Accept</button>
                  <button className="btn-secondary" onClick={() => respond.mutate({ id: c.id, accept: false })} disabled={respond.isPending} type="button">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">My network</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {others.map((c) => (
            <div key={c.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={c.counterpartName} />
                <div>
                  <div className="font-semibold text-slate-900">{c.counterpartName}</div>
                  <div className="text-sm text-slate-500">{c.counterpartHeadline || '—'}</div>
                  <div className="mt-1 flex gap-1.5">
                    <Badge tone={toneFor(CONNECTION_TYPE, c.type)}>{labelFor(CONNECTION_TYPE, c.type)}</Badge>
                    <Badge tone={toneFor(CONNECTION_STATUS, c.status)}>{labelFor(CONNECTION_STATUS, c.status)}</Badge>
                    {c.isIncoming ? null : <span className="text-xs text-slate-400">· you requested</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canRequestMentorship(c) && (
                  <button
                    className="text-xs font-semibold text-amber-700 hover:underline"
                    onClick={() => request.mutate({ addresseeUserId: c.counterpartUserId, type: 'Mentorship', message: null })}
                    disabled={request.isPending}
                    type="button"
                  >
                    Request mentorship
                  </button>
                )}
                {c.status === 'Accepted' && (
                  <Link to={`/messages?to=${c.counterpartUserId}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                    Message
                  </Link>
                )}
                <button className="text-xs text-red-600 hover:underline" onClick={() => remove.mutate(c.id)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestionsTab() {
  const { data, isLoading, isError, error, refetch } = useSuggestions();
  const request = useRequestConnection();
  const [pendingId, setPendingId] = useState(null);

  const send = (userId, type) => {
    setPendingId(`${userId}-${type}`);
    request.mutate({ addresseeUserId: userId, type, message: null }, { onSettled: () => setPendingId(null) });
  };

  if (isLoading) return <Spinner label="Finding people you may know…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if ((data || []).length === 0) {
    return <EmptyState title="No suggestions right now" message="Add skills and a cohort to your profile to get better matches." />;
  }

  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Badge tone="purple">AI</Badge>
        Ranked by shared skills, cohort, industry and mentor availability.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.map((p) => (
          <div key={p.userId} className="card flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
              <Avatar name={p.fullName} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-slate-900">{p.fullName}</h3>
                  {p.isMentor && <Badge tone="amber">Mentor</Badge>}
                </div>
                <p className="truncate text-sm text-slate-500">{p.headline || p.industry || '—'}</p>
              </div>
              <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700" title="Heuristic match score">★ {p.score}</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-500">
              {p.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> {r}</li>
              ))}
            </ul>
            <div className="mt-auto flex gap-2">
              <button className="btn-primary flex-1" onClick={() => send(p.userId, 'Connection')} disabled={pendingId === `${p.userId}-Connection`} type="button">Connect</button>
              {p.isMentor && (
                <button className="btn-secondary flex-1" onClick={() => send(p.userId, 'Mentorship')} disabled={pendingId === `${p.userId}-Mentorship`} type="button">Request mentorship</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlumniNetworking() {
  const [tab, setTab] = useState('suggestions');
  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'suggestions', label: 'Suggestions' },
          { value: 'connections', label: 'My Network' },
        ]}
      />
      <div className="mt-6">{tab === 'suggestions' ? <SuggestionsTab /> : <ConnectionsTab />}</div>
    </div>
  );
}

export function NetworkingPage() {
  const { user } = useAuth();
  const isMentor = user?.role === 'Mentor';

  return (
    <div>
      <PageHeader
        title={isMentor ? 'Mentees & Requests' : 'Networking'}
        subtitle={
          isMentor
            ? 'Manage your mentees, respond to mentorship requests, and message your network.'
            : 'Connect with alumni and find mentors across the community.'
        }
      />
      {isMentor ? <MentorNetworking /> : <AlumniNetworking />}
    </div>
  );
}
