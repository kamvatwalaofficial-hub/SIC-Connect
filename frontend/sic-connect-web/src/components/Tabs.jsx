/** Simple, accessible tab switcher. */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
