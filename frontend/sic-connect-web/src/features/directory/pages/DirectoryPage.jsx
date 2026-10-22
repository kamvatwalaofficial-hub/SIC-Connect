import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Field } from '../../../components/Field.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { SocialLinks } from '../../../components/SocialLinks.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { EMPLOYMENT_STATUS, labelFor } from '../../../lib/constants.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useConnections, useRequestConnection } from '../../networking/api.js';
import { useDirectory } from '../api.js';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Avatar({ name, size = 'h-11 w-11', text = 'text-sm' }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-brand-100 ${text} font-bold text-brand-700`}>
      {initials(name) || '👤'}
    </div>
  );
}

function AlumniCard({ person, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(person)} className="card flex flex-col gap-3 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar name={person.fullName} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{person.fullName}</h3>
            {person.isMentor && <Badge tone="amber">Mentor</Badge>}
          </div>
          <p className="truncate text-sm text-slate-500">{person.headline || labelFor(EMPLOYMENT_STATUS, person.employmentStatus)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(person.skills || []).slice(0, 6).map((s) => (
          <Badge key={s} tone="brand">{s}</Badge>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {person.cohort && <span>🎓 Cohort {person.cohort}</span>}
        {person.location && <span>📍 {person.location}</span>}
        {person.industry && <span>🏢 {person.industry}</span>}
      </div>
    </button>
  );
}

function ProfileModal({ person, onClose, linkStatus }) {
  const request = useRequestConnection();
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  if (!person) return null;

  const isSelf = person.userId === user?.userId;
  const alreadyLinked = Boolean(linkStatus);
  const connected = linkStatus === 'Accepted';

  const connect = () => {
    request.mutate(
      { addresseeUserId: person.userId, type: 'Connection', message: null },
      { onSuccess: () => setSent(true) },
    );
  };

  const footer = isSelf ? (
    <span className="text-sm text-slate-400">This is you.</span>
  ) : connected ? (
    <Link to={`/messages?to=${person.userId}`} className="btn-primary" onClick={onClose}>Message</Link>
  ) : sent || linkStatus === 'Pending' ? (
    <Badge tone="amber">Request pending</Badge>
  ) : alreadyLinked ? (
    <Badge tone="slate">{linkStatus}</Badge>
  ) : (
    <>
      <button className="btn-secondary" onClick={onClose} type="button">Close</button>
      <button className="btn-primary" onClick={connect} disabled={request.isPending} type="button">
        {request.isPending ? 'Sending…' : 'Connect'}
      </button>
    </>
  );

  return (
    <Modal open onClose={onClose} title="Profile" footer={footer}>
      <div className="flex items-start gap-4">
        <Avatar name={person.fullName} size="h-14 w-14" text="text-base" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{person.fullName}</h3>
            {person.isMentor && <Badge tone="amber">Mentor</Badge>}
          </div>
          <p className="text-sm text-slate-500">{person.headline || labelFor(EMPLOYMENT_STATUS, person.employmentStatus)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        {person.cohort && <span>🎓 Cohort {person.cohort}</span>}
        {person.location && <span>📍 {person.location}</span>}
        {person.industry && <span>🏢 {person.industry}</span>}
      </div>

      {/* Clickable LinkedIn / GitHub buttons — open in a new tab; hidden when not provided. */}
      <SocialLinks linkedInUrl={person.linkedInUrl} gitHubUrl={person.gitHubUrl} className="mt-4" />

      {(person.skills || []).length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {person.skills.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}
          </div>
        </div>
      )}

      {request.isError && <p className="mt-3 text-sm text-red-600">{request.error.message}</p>}
    </Modal>
  );
}

export function DirectoryPage() {
  const { user } = useAuth();
  const { data: connections } = useConnections();
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    q: '', skill: '', cohort: '', employmentStatus: '', mentorsOnly: false, page: 1, pageSize: 12,
  });

  const debouncedQ = useDebounce(filters.q);
  const debouncedSkill = useDebounce(filters.skill);
  const effectiveFilters = useMemo(
    () => ({ ...filters, q: debouncedQ, skill: debouncedSkill }),
    [filters, debouncedQ, debouncedSkill],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useDirectory(effectiveFilters);

  // Map counterpartUserId -> connection status, to reflect state in the profile modal.
  const linkStatusById = useMemo(() => {
    const map = {};
    (connections || []).forEach((c) => { map[c.counterpartUserId] = c.status; });
    return map;
  }, [connections]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const items = (data?.items || []).filter((p) => p.userId !== user?.userId);
  const totalPages = data?.totalPages || 1;

  return (
    <div>
      <PageHeader title="Community Directory" subtitle="Browse fellow SIC graduates — open a profile to connect or message." />

      <div className="card mb-6 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search" value={filters.q} onChange={set('q')} placeholder="Name, headline, skill…" />
        <Field label="Skill" value={filters.skill} onChange={set('skill')} placeholder="e.g. React" />
        <Field label="Cohort" value={filters.cohort} onChange={set('cohort')} placeholder="e.g. 2024" />
        <Field label="Employment" as="select" value={filters.employmentStatus} onChange={set('employmentStatus')}>
          <option value="">Any</option>
          {EMPLOYMENT_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={filters.mentorsOnly} onChange={set('mentorsOnly')} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          Mentors only
        </label>
      </div>

      {isLoading ? (
        <Spinner label="Searching the directory…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState title="No alumni found" message="Try adjusting your filters or search terms." />
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-70' : ''}`}>
            {items.map((person) => (
              <AlumniCard key={person.userId} person={person} onOpen={setSelected} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button className="btn-secondary" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} type="button">Previous</button>
              <span className="text-sm text-slate-500">Page {data.page} of {totalPages}</span>
              <button className="btn-secondary" disabled={filters.page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} type="button">Next</button>
            </div>
          )}
        </>
      )}

      <ProfileModal
        person={selected}
        onClose={() => setSelected(null)}
        linkStatus={selected ? linkStatusById[selected.userId] : null}
      />
    </div>
  );
}
