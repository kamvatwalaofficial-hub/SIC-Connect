/** Horizontal bar chart, good for ranked lists like top skills. data: [{ label, value, color? }]. */
export function HBars({ data, color = '#1428a0' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No data yet.</p>;

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate pr-2 text-slate-600">{d.label}</span>
            <span className="font-semibold text-slate-900">{d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || color }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
