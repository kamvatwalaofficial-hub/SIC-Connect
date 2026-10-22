import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/EmptyState.jsx';
import { formatDateTime } from '../../lib/constants.js';
import { useMarkAllRead, useMarkNotificationRead, useNotifications } from './api.js';

export function NotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const navigate = useNavigate();

  const onClick = (n) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Updates on your applications, connections and the community."
        actions={
          <button className="btn-secondary" onClick={() => markAll.mutate()} type="button">
            Mark all read
          </button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading notifications…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title="You’re all caught up 🎉" message="New notifications will show up here." />
      ) : (
        <div className="card divide-y divide-slate-100">
          {data.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onClick(n)}
              className={`flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50 ${n.isRead ? '' : 'bg-brand-50/40'}`}
            >
              {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              <div className={n.isRead ? 'pl-5' : ''}>
                <p className="text-sm text-slate-700">{n.message}</p>
                <p className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
