import { useState } from 'react';

/** Vertical bar chart. data: [{ label, value }]. */
export function Bars({ data, color = '#1428a0', height = 150 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="group flex flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className="w-full max-w-[38px] rounded-t-md transition-all duration-300"
              style={{
                height: `${(d.value / max) * (height - 24)}px`,
                minHeight: d.value > 0 ? 4 : 0,
                backgroundColor: color,
                opacity: hover == null || hover === i ? 1 : 0.55,
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d, i) => (
          <span key={i} className={`flex-1 text-center text-[11px] ${hover === i ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
            {d.label}
          </span>
        ))}
      </div>
      <p className="mt-1 h-4 text-center text-xs text-slate-500">
        {hover != null ? `${data[hover].label}: ${data[hover].value}` : ''}
      </p>
    </div>
  );
}
