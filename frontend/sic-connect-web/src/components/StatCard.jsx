export function StatCard({ label, value, hint, icon }) {
  return (
    <div className="card card-hover flex items-center gap-4 p-5">
      {icon && <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-xl text-brand-600">{icon}</div>}
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  );
}
