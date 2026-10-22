import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Field } from '../../../components/Field.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { APPLICATION_STATUS, OPPORTUNITY_TYPES, formatDate, labelFor, toneFor } from '../../../lib/constants.js';
import { useApplyToOpportunity, useMyApplications } from '../../applications/api.js';
import {
  useCreateOpportunity,
  useDeleteOpportunity,
  useOpportunities,
  useOpportunityApplications,
  useRecommendations,
  useUpdateApplicationStatus,
  useUpdateOpportunity,
} from '../api.js';

const EMPTY = {
  type: 'Job',
  title: '',
  organisation: '',
  location: '',
  description: '',
  applyUrl: '',
  deadline: '',
  isMentorshipTagged: false,
};

function toForm(o) {
  if (!o) return EMPTY;
  return {
    type: o.type,
    title: o.title,
    organisation: o.organisation,
    location: o.location || '',
    description: o.description || '',
    applyUrl: o.applyUrl || '',
    deadline: o.deadline ? o.deadline.slice(0, 10) : '',
    isMentorshipTagged: Boolean(o.isMentorshipTagged),
  };
}

/** Create/edit form. Pass `initial` (with id) to edit, otherwise it creates. */
function OpportunityForm({ initial, onClose }) {
  const create = useCreateOpportunity();
  const update = useUpdateOpportunity();
  const [form, setForm] = useState(toForm(initial));
  const busy = create.isPending || update.isPending;
  const err = create.error || update.error;

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      location: form.location || null,
      description: form.description || null,
      applyUrl: form.applyUrl || null,
      deadline: form.deadline || null,
    };
    if (initial?.id) await update.mutateAsync({ id: initial.id, payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  return (
    <form onSubmit={onSubmit} className="card mb-6 w-full space-y-4 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {initial?.id ? 'Edit opportunity' : 'Publish opportunity'}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type" as="select" value={form.type} onChange={set('type')}>
          {OPPORTUNITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Field>
        <Field label="Title" required value={form.title} onChange={set('title')} />
        <Field label="Organisation" required value={form.organisation} onChange={set('organisation')} />
        <Field label="Location" value={form.location} onChange={set('location')} />
        <Field label="Apply URL" value={form.applyUrl} onChange={set('applyUrl')} placeholder="https://…" />
        <Field label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} />
      </div>
      <Field label="Description" as="textarea" rows={3} value={form.description} onChange={set('description')} />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.isMentorshipTagged} onChange={set('isMentorshipTagged')} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
        Mentorship-tagged (priority visibility for mentors)
      </label>
      {err && <p className="text-sm text-red-600">{err.message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Publish'}
        </button>
        <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

function ApplyButton({ opportunity, applied }) {
  const apply = useApplyToOpportunity();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  if (applied) return <Badge tone="green">✓ Applied</Badge>;
  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)} type="button">Apply</button>
    );
  }
  return (
    <div className="w-full space-y-2">
      <textarea className="input" rows={2} placeholder="Optional cover note…" value={note} onChange={(e) => setNote(e.target.value)} />
      {apply.isError && <p className="text-xs text-red-600">{apply.error.message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" type="button" disabled={apply.isPending}
          onClick={() => apply.mutate({ opportunityId: opportunity.id, coverNote: note || null }, { onSuccess: () => setOpen(false) })}>
          {apply.isPending ? 'Submitting…' : 'Submit application'}
        </button>
        <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

function ApplicantsPanel({ opportunityId }) {
  const { data, isLoading } = useOpportunityApplications(opportunityId, true);
  const updateStatus = useUpdateApplicationStatus(opportunityId);

  if (isLoading) return <p className="text-sm text-slate-400">Loading applicants…</p>;
  if ((data?.length ?? 0) === 0) return <p className="text-sm text-slate-400">No applications yet.</p>;

  return (
    <div className="space-y-2">
      {data.map((a) => (
        <div key={a.id} className="rounded-lg border border-slate-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800">{a.applicantName}</span>
            <Badge tone={toneFor(APPLICATION_STATUS, a.status)}>{labelFor(APPLICATION_STATUS, a.status)}</Badge>
          </div>
          {a.coverNote && <p className="mt-1 text-sm italic text-slate-600">“{a.coverNote}”</p>}
          <div className="mt-2 flex gap-2">
            <button className="btn-primary px-3 py-1 text-xs" type="button" disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ applicationId: a.id, status: 'Accepted' })}>Accept</button>
            <button className="btn-danger px-3 py-1 text-xs" type="button" disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ applicationId: a.id, status: 'Rejected' })}>Reject</button>
            <button className="btn-secondary px-3 py-1 text-xs" type="button" disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ applicationId: a.id, status: 'UnderReview' })}>Under review</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OpportunityCard({ opportunity, isAdmin, onDelete, onEdit, applied }) {
  const [showApplicants, setShowApplicants] = useState(false);
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={toneFor(OPPORTUNITY_TYPES, opportunity.type)}>{labelFor(OPPORTUNITY_TYPES, opportunity.type)}</Badge>
            {opportunity.isMentorshipTagged && <Badge tone="amber">Mentorship</Badge>}
          </div>
          <h3 className="mt-2 font-semibold text-slate-900">{opportunity.title}</h3>
          <p className="text-sm text-slate-500">{opportunity.organisation}</p>
        </div>
      </div>

      {opportunity.description && <p className="text-sm text-slate-600">{opportunity.description}</p>}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {opportunity.location && <span>📍 {opportunity.location}</span>}
        {opportunity.deadline && <span>⏰ Closes {formatDate(opportunity.deadline)}</span>}
      </div>

      {isAdmin ? (
        <div className="mt-auto space-y-3 pt-1">
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary px-3 py-1 text-xs" type="button" onClick={() => onEdit(opportunity)}>Edit</button>
            <button className="btn-secondary px-3 py-1 text-xs" type="button" onClick={() => setShowApplicants((s) => !s)}>
              {showApplicants ? 'Hide applicants' : 'View applicants'}
            </button>
            <button className="btn-danger px-3 py-1 text-xs" type="button" onClick={() => onDelete(opportunity.id)}>Delete</button>
          </div>
          {showApplicants && <ApplicantsPanel opportunityId={opportunity.id} />}
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <ApplyButton opportunity={opportunity} applied={applied} />
          {opportunity.applyUrl && (
            <a href={opportunity.applyUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              External link →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationsStrip({ appliedIds }) {
  const { data, isLoading } = useRecommendations();
  if (isLoading || !data || data.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Badge tone="purple">AI</Badge>
        <h2 className="font-semibold text-slate-900">Recommended for you</h2>
        <span className="text-xs text-slate-500">Based on your profile & skills</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map(({ opportunity, score, reasons }) => (
          <div key={opportunity.id} className="card flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <Badge tone={toneFor(OPPORTUNITY_TYPES, opportunity.type)}>{labelFor(OPPORTUNITY_TYPES, opportunity.type)}</Badge>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700" title="Heuristic match score">★ {score}</span>
            </div>
            <h3 className="font-semibold text-slate-900">{opportunity.title}</h3>
            <p className="text-sm text-slate-500">{opportunity.organisation}</p>
            <ul className="space-y-0.5 text-xs text-slate-500">
              {reasons.slice(0, 2).map((r, i) => (
                <li key={i} className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> {r}</li>
              ))}
            </ul>
            <div className="mt-auto pt-1">
              <ApplyButton opportunity={opportunity} applied={appliedIds.has(opportunity.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpportunitiesPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading, isError, error, refetch } = useOpportunities();
  const { data: myApps } = useMyApplications();
  const del = useDeleteOpportunity();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const appliedIds = useMemo(() => new Set((myApps || []).map((a) => a.opportunityId)), [myApps]);

  const onDelete = (id) => {
    if (window.confirm('Delete this opportunity?')) del.mutate(id);
  };
  const onEdit = (o) => { setEditing(o); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  return (
    <div>
      <PageHeader
        title="Opportunities Hub"
        subtitle="Jobs, internships, graduate programmes, hackathons and scholarships."
        actions={
          isAdmin ? (
            !formOpen && <button className="btn-primary" type="button" onClick={() => { setEditing(null); setFormOpen(true); }}>+ Publish opportunity</button>
          ) : (
            <Link to="/applications" className="btn-secondary">My applications</Link>
          )
        }
      />

      {isAdmin && formOpen && <OpportunityForm initial={editing} onClose={closeForm} />}
      {!isAdmin && <RecommendationsStrip appliedIds={appliedIds} />}

      {isLoading ? (
        <Spinner label="Loading opportunities…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title="No opportunities yet" message="Check back soon — new opportunities are posted regularly." />
      ) : (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">All opportunities</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} isAdmin={isAdmin} onDelete={onDelete} onEdit={onEdit} applied={appliedIds.has(o.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
