import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Field } from '../../../components/Field.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { formatDateTime } from '../../../lib/constants.js';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '../api.js';

const EMPTY = { title: '', body: '', audience: 'All' };

function CreateAnnouncementForm() {
  const create = useCreateAnnouncement();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    await create.mutateAsync(form);
    setForm(EMPTY);
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)} type="button">
        + New announcement
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card w-full space-y-4 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Broadcast announcement</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field className="sm:col-span-2" label="Title" required value={form.title} onChange={set('title')} />
        <Field label="Audience" as="select" value={form.audience} onChange={set('audience')}>
          <option value="All">All</option>
          <option value="Alumni">Alumni</option>
          <option value="Mentors">Mentors</option>
        </Field>
      </div>
      <Field label="Message" as="textarea" rows={3} required value={form.body} onChange={set('body')} />
      {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" type="submit" disabled={create.isPending}>
          {create.isPending ? 'Publishing…' : 'Publish'}
        </button>
        <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AnnouncementsPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading, isError, error, refetch } = useAnnouncements();
  const del = useDeleteAnnouncement();

  const onDelete = (id) => {
    if (window.confirm('Delete this announcement?')) del.mutate(id);
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Updates on opportunities, events and platform news."
        actions={isAdmin ? <CreateAnnouncementForm /> : null}
      />

      {isLoading ? (
        <Spinner label="Loading announcements…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title="No announcements" message="There’s nothing to share right now." />
      ) : (
        <div className="space-y-4">
          {data.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <Badge tone="brand">{a.audience}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{formatDateTime(a.publishedAt)}</p>
                </div>
                {isAdmin && (
                  <button className="text-xs text-red-600 hover:underline" onClick={() => onDelete(a.id)} type="button">
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
