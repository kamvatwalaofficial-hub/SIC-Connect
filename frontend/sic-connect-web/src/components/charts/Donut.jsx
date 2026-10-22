import { useState } from 'react';

/**
 * Dependency-free SVG doughnut chart.
 * data: [{ label, value, color }]. Shows a centre total and an interactive hover state.
 */
export function Donut({ data, size = 190, thickness = 24, centerLabel = 'Total' }) {
  const [active, setActive] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;

  let acc = 0;
  const centre = active != null ? data[active] : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${c} ${c})`}>
          {total === 0 && (
            <circle cx={c} cy={c} r={r} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
          )}
          {data.map((d, i) => {
            const pct = total ? (d.value / total) * 100 : 0;
            const seg = (
              <circle
                key={i}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={active === i ? thickness + 4 : thickness}
                pathLength={100}
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={-acc}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-200"
                style={{ opacity: active == null || active === i ? 1 : 0.45 }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            acc += pct;
            return seg;
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{centre ? centre.value : total}</span>
        <span className="max-w-[7rem] text-center text-xs text-slate-500">
          {centre ? centre.label : centerLabel}
        </span>
      </div>
    </div>
  );
}
