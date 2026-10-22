const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
};

export function Badge({ children, tone = 'slate', className = '' }) {
  return <span className={`badge ${TONES[tone] || TONES.slate} ${className}`}>{children}</span>;
}
