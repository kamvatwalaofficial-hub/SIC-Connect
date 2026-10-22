export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">📭</div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message && <p className="max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-2 border-red-100 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">⚠️</div>
      <h3 className="text-base font-semibold text-slate-800">Couldn’t load this</h3>
      <p className="max-w-md text-sm text-slate-500">{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <button className="btn-secondary mt-2" onClick={onRetry} type="button">
          Retry
        </button>
      )}
    </div>
  );
}
