import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { APPLICATION_STATUS, OPPORTUNITY_TYPES, formatDate, labelFor, toneFor } from '../../../lib/constants.js';
import { useMyApplications, useWithdrawApplication } from '../api.js';

export function ApplicationsPage() {
  const { data, isLoading, isError, error, refetch } = useMyApplications();
  const withdraw = useWithdrawApplication();

  const onWithdraw = (id) => {
    if (window.confirm('Withdraw this application?')) withdraw.mutate(id);
  };

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle="Track the opportunities you’ve applied to."
        actions={
          <Link to="/opportunities" className="btn-secondary">
            Browse opportunities
          </Link>
        }
      />

      {isLoading ? (
        <Spinner label="Loading your applications…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No applications yet"
          message="When you apply to an opportunity, it’ll appear here."
          action={<Link to="/opportunities" className="btn-primary">Find opportunities</Link>}
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {data.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{a.opportunityTitle}</h3>
                  <Badge tone={toneFor(OPPORTUNITY_TYPES, a.opportunityType)}>{labelFor(OPPORTUNITY_TYPES, a.opportunityType)}</Badge>
                </div>
                <p className="text-sm text-slate-500">{a.organisation} · applied {formatDate(a.createdAt)}</p>
                {a.coverNote && <p className="mt-1 text-sm text-slate-600">“{a.coverNote}”</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={toneFor(APPLICATION_STATUS, a.status)}>{labelFor(APPLICATION_STATUS, a.status)}</Badge>
                <button className="text-xs text-red-600 hover:underline" onClick={() => onWithdraw(a.id)} type="button">
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
