import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Field } from '../../../components/Field.jsx';
import { Tabs } from '../../../components/Tabs.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { formatDate, formatDateTime } from '../../../lib/constants.js';
import {
  useCreateEvent,
  useDeleteEvent,
  useEventAttendees,
  useEvents,
  useToggleRegistration,
  useUpdateEvent,
} from '../api.js';

const EMPTY = { title: '', description: '', startsAt: '', endsAt: '', venue: '', isOnline: false, capacity: '' };

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // to "YYYY-MM-DDTHH:mm" in local time
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toForm(ev) {
  if (!ev) return EMPTY;
  return {
    title: ev.title,
    description: ev.description || '',
    startsAt: toLocalInput(ev.startsAt),
    endsAt: toLocalInput(ev.endsAt),
    venue: ev.venue || '',
    isOnline: Boolean(ev.isOnline),
    capacity: ev.capacity != null ? String(ev.capacity) : '',
  };
}

function EventForm({ initial, onClose }) {
  const create = useCreateEvent();
  const update = useUpdateEvent();
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
      title: form.title,
      description: form.description || null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      venue: form.venue || null,
      isOnline: form.isOnline,
      capacity: form.capacity ? Number(form.capacity) : null,
    };
    if (initial?.id) await update.mutateAsync({ id: initial.id, payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  return (
    <form onSubmit={onSubmit} className="card mb-6 w-full space-y-4 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {initial?.id ? 'Edit event' : 'Create event'}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" required value={form.title} onChange={set('title')} />
        <Field label="Venue" value={form.venue} onChange={set('venue')} />
        <Field label="Starts at" type="datetime-local" required value={form.startsAt} onChange={set('startsAt')} />
        <Field label="Ends at" type="datetime-local" value={form.endsAt} onChange={set('endsAt')} />
        <Field label="Capacity" type="number" min="1" value={form.capacity} onChange={set('capacity')} />
        <label className="flex items-center gap-2 self-end text-sm text-slate-700">
          <input type="checkbox" checked={form.isOnline} onChange={set('isOnline')} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          Online event
        </label>
      </div>
      <Field label="Description" as="textarea" rows={3} value={form.description} onChange={set('description')} />
      {err && <p className="text-sm text-red-600">{err.message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Create'}
        </button>
        <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

function capacityTone(pct) {
  if (pct >= 90) return '#ef4444';
  if (pct >= 60) return '#f59e0b';
  return '#16a34a';
}

function CapacityMeter({ registrationCount, capacity }) {
  if (capacity == null) {
    return <div className="text-xs text-slate-500">👥 {registrationCount} registered · no capacity limit</div>;
  }
  const pct = Math.min(100, Math.round((registrationCount / capacity) * 100));
  const remaining = Math.max(0, capacity - registrationCount);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>👥 {registrationCount} / {capacity} registered</span>
        <span>{remaining} space{remaining === 1 ? '' : 's'} left</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: capacityTone(pct) }} />
      </div>
    </div>
  );
}

function AttendeesPanel({ eventId }) {
  const { data, isLoading } = useEventAttendees(eventId, true);
  if (isLoading) return <p className="text-sm text-slate-400">Loading attendees…</p>;
  if ((data?.length ?? 0) === 0) return <p className="text-sm text-slate-400">No attendees yet.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
      {data.map((a) => (
        <li key={a.userId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <span>
            <span className="font-medium text-slate-800">{a.fullName}</span>
            {a.headline && <span className="text-slate-400"> · {a.headline}</span>}
          </span>
          <span className="text-xs text-slate-400">{formatDate(a.registeredAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function EventCard({ event, isAdmin, onToggle, pending, onEdit, onDelete }) {
  const [showAttendees, setShowAttendees] = useState(false);
  const full = event.capacity != null && event.registrationCount >= event.capacity && !event.isRegistered;

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {event.isOnline ? <Badge tone="brand">Online</Badge> : <Badge tone="slate">In person</Badge>}
            {event.isRegistered && <Badge tone="green">Registered</Badge>}
          </div>
          <h3 className="mt-2 font-semibold text-slate-900">{event.title}</h3>
          <p className="text-sm text-slate-500">🗓️ {formatDateTime(event.startsAt)}</p>
        </div>
      </div>

      {event.description && <p className="text-sm text-slate-600">{event.description}</p>}
      {event.venue && <div className="text-xs text-slate-500">📍 {event.venue}</div>}

      <CapacityMeter registrationCount={event.registrationCount} capacity={event.capacity} />

      {isAdmin ? (
        <div className="mt-auto space-y-3 pt-1">
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary px-3 py-1 text-xs" type="button" onClick={() => onEdit(event)}>Edit</button>
            <button className="btn-secondary px-3 py-1 text-xs" type="button" onClick={() => setShowAttendees((s) => !s)}>
              {showAttendees ? 'Hide attendees' : 'View attendees'}
            </button>
            <button className="btn-danger px-3 py-1 text-xs" type="button" onClick={() => onDelete(event.id)}>Delete</button>
          </div>
          {showAttendees && <AttendeesPanel eventId={event.id} />}
        </div>
      ) : (
        <button
          className={event.isRegistered ? 'btn-secondary mt-auto' : 'btn-primary mt-auto'}
          onClick={() => onToggle(event)}
          disabled={pending || full}
          type="button"
        >
          {event.isRegistered ? 'Cancel registration' : full ? 'Event full' : 'Register to attend'}
        </button>
      )}
    </div>
  );
}

function CalendarView({ events, cardProps }) {
  const groups = events.reduce((acc, e) => {
    const key = formatDate(e.startsAt, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    (acc[key] ||= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400">📅 Agenda view — a full month calendar is a planned enhancement.</p>
      {Object.entries(groups).map(([date, list]) => (
        <div key={date}>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-brand-500" />
            <h3 className="text-sm font-semibold text-slate-700">{date}</h3>
          </div>
          <div className="ml-5 space-y-3 border-l-2 border-slate-100 pl-5">
            {list.map((event) => (
              <EventCard key={event.id} event={event} {...cardProps} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventsPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading, isError, error, refetch } = useEvents();
  const toggle = useToggleRegistration();
  const del = useDeleteEvent();
  const [view, setView] = useState('list');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const onToggle = (event) => toggle.mutate({ id: event.id, isRegistered: event.isRegistered });
  const onDelete = (id) => { if (window.confirm('Delete this event?')) del.mutate(id); };
  const onEdit = (ev) => { setEditing(ev); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const events = data || [];

  const cardProps = { isAdmin, onToggle, pending: toggle.isPending, onEdit, onDelete };

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Browse community events and register to attend."
        actions={isAdmin && !formOpen ? (
          <button className="btn-primary" type="button" onClick={() => { setEditing(null); setFormOpen(true); }}>+ Create event</button>
        ) : null}
      />

      {isAdmin && formOpen && <EventForm initial={editing} onClose={closeForm} />}

      <Tabs
        value={view}
        onChange={setView}
        tabs={[
          { value: 'list', label: 'List' },
          { value: 'calendar', label: 'Calendar' },
        ]}
      />

      <div className="mt-6">
        {isLoading ? (
          <Spinner label="Loading events…" />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : events.length === 0 ? (
          <EmptyState title="No events scheduled" message="New events will appear here once they’re announced." />
        ) : view === 'calendar' ? (
          <CalendarView events={events} cardProps={cardProps} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} {...cardProps} />
            ))}
          </div>
        )}
      </div>
      {toggle.isError && <p className="mt-4 text-center text-sm text-red-600">{toggle.error.message}</p>}
    </div>
  );
}
