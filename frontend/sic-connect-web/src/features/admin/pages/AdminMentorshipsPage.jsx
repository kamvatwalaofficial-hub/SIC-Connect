import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Tabs } from '../../../components/Tabs.jsx';
import { CONNECTION_STATUS, formatDate, labelFor, toneFor } from '../../../lib/constants.js';
import { useAdminMentorships } from '../api.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Accepted', label: 'Active' },
  { value: 'Declined', label: 'Declined' },
];

export function AdminMentorshipsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminMentorships();
  const [tab, setTab] = useState('all');

  const counts = useMemo(() => {
    const c = { all: (data || []).length, Pending: 0, Accepted: 0, Declined: 0 };
    (data || []).forEach((m) => { c[m.status] = (c[m.status] || 0) + 1; });
    return c;
  }, [data]);

  const rows = useMemo(
    () => (tab === 'all' ? data || [] : (data || []).filter((m) => m.status === tab)),
    [data, tab],
  );

  return (
    <div>
      <PageHeader
        title="Mentorship Management"
        subtitle="Oversight of every mentorship request submitted by alumni to mentors."
      />

      {isLoading ? (
        <Spinner label="Loading mentorship requests…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={FILTERS.map((f) => ({ ...f, count: counts[f.value] ?? 0 }))}
          />

          <div className="mt-4">
            {rows.length === 0 ? (
              <EmptyState title="Nothing here" message="No mentorship requests in this category." />
            ) : (
              <div className="card overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Alumnus</th>
                      <th className="px-4 py-3">Mentor</th>
                      <th className="px-4 py-3">Message</th>
                      <th className="px-4 py-3">Requested</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{m.alumnusName}</td>
                        <td className="px-4 py-3 text-slate-700">{m.mentorName}</td>
                        <td className="max-w-xs px-4 py-3 text-slate-500">
                          {m.message ? <span className="line-clamp-2 italic">“{m.message}”</span> : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(m.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={toneFor(CONNECTION_STATUS, m.status)}>{labelFor(CONNECTION_STATUS, m.status)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
