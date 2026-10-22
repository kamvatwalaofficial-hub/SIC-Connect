import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { formatDate } from '../../../lib/constants.js';
import { useApprovals, useApproveAccount, useRejectAccount, useRequestAccountInfo } from '../api.js';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

const STATUS_TONE = { Pending: 'amber', InfoRequested: 'purple' };
const STATUS_LABEL = { Pending: 'Pending review', InfoRequested: 'Info requested' };

function ApprovalCard({ applicant }) {
  const approve = useApproveAccount();
  const reject = useRejectAccount();
  const requestInfo = useRequestAccountInfo();
  const [mode, setMode] = useState(null); // 'reject' | 'info' | null
  const [note, setNote] = useState('');

  const busy = approve.isPending || reject.isPending || requestInfo.isPending;

  const submitNote = () => {
    const action = mode === 'reject' ? reject : requestInfo;
    action.mutate({ id: applicant.userId, note: note || null }, { onSuccess: () => { setMode(null); setNote(''); } });
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {initials(applicant.fullName) || '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{applicant.fullName || '—'}</h3>
              <Badge tone={STATUS_TONE[applicant.status] || 'slate'}>{STATUS_LABEL[applicant.status] || applicant.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">{applicant.email}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {applicant.cohort && <span>🎓 Cohort {applicant.cohort}</span>}
              {applicant.industry && <span>🏢 {applicant.industry}</span>}
              {applicant.location && <span>📍 {applicant.location}</span>}
              <span>🗓️ Applied {formatDate(applicant.requestedAt)}</span>
            </div>
            {applicant.headline && <p className="mt-1 text-sm text-slate-600">{applicant.headline}</p>}
            {applicant.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {applicant.skills.slice(0, 8).map((s) => (
                  <Badge key={s} tone="brand">{s}</Badge>
                ))}
              </div>
            )}
            {applicant.reviewNote && (
              <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">
                Note to applicant: “{applicant.reviewNote}”
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-44">
          <button className="btn-primary" onClick={() => approve.mutate({ id: applicant.userId })} disabled={busy} type="button">
            Approve
          </button>
          <button className="btn-secondary" onClick={() => { setMode('info'); setNote(''); }} disabled={busy} type="button">
            Request info
          </button>
          <button className="btn-danger" onClick={() => { setMode('reject'); setNote(''); }} disabled={busy} type="button">
            Reject
          </button>
        </div>
      </div>

      {mode && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="label">
            {mode === 'reject' ? 'Reason for rejection (optional)' : 'What information is needed? (optional)'}
          </label>
          <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button className={mode === 'reject' ? 'btn-danger' : 'btn-primary'} onClick={submitNote} disabled={busy} type="button">
              {mode === 'reject' ? 'Confirm rejection' : 'Send request'}
            </button>
            <button className="btn-secondary" onClick={() => setMode(null)} type="button">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AccountApprovalsPage() {
  const { data, isLoading, isError, error, refetch } = useApprovals();

  return (
    <div>
      <PageHeader
        title="Account Approval Queue"
        subtitle="Review new registrations and verify legitimate Samsung Innovation Campus graduates."
        actions={data?.length ? <Badge tone="amber">{data.length} awaiting review</Badge> : null}
      />

      {isLoading ? (
        <Spinner label="Loading pending accounts…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title="All caught up 🎉" message="There are no accounts awaiting approval." />
      ) : (
        <div className="space-y-4">
          {data.map((a) => (
            <ApprovalCard key={a.userId} applicant={a} />
          ))}
        </div>
      )}
    </div>
  );
}
