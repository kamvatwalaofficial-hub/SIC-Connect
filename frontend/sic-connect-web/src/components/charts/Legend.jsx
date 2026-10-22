/** Colour-coded legend with labels and counts. items: [{ label, value, color }]. */
export function Legend({ items, total }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: it.color }} />
            {it.label}
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{it.value}</span>
            {typeof total === 'number' && total > 0 && (
              <span className="w-10 text-right text-xs text-slate-400">
                {Math.round((it.value / total) * 100)}%
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
