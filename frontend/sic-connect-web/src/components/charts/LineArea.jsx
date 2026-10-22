import { useState } from 'react';

/**
 * SVG line / area chart. data: [{ label, value }]. Set `area` for a filled gradient.
 * Interactive: hovering a point highlights it and shows a value tooltip.
 */
export function LineArea({ data, color = '#1428a0', area = true, height = 150 }) {
  const [hover, setHover] = useState(null);
  const W = 320;
  const H = height;
  const padX = 8;
  const padY = 16;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;

  const x = (i) => padX + (n <= 1 ? 0 : (i * (W - padX * 2)) / (n - 1));
  const y = (v) => padY + (H - padY * 2) * (1 - v / max);

  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPath = `M ${x(0)},${H - padY} L ${pts.split(' ').join(' L ')} L ${x(n - 1)},${H - padY} Z`;
  const gid = `grad-${color.replace('#', '')}`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={padX} x2={W - padX} y1={padY + (H - padY * 2) * g} y2={padY + (H - padY * 2) * g} stroke="#f1f5f9" strokeWidth="1" />
        ))}

        {area && n > 1 && <path d={areaPath} fill={`url(#${gid})`} />}
        {n > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 3} fill="#fff" stroke={color} strokeWidth="2" />
            <rect
              x={x(i) - (W - padX * 2) / (2 * Math.max(1, n))}
              y={0}
              width={(W - padX * 2) / Math.max(1, n)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[11px] text-slate-400">
        {data.map((d, i) => (
          <span key={i} className={hover === i ? 'font-semibold text-slate-700' : ''}>
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
