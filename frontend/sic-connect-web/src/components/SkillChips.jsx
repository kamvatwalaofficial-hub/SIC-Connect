// Read-only display of skills as modern chips. Accepts an array of strings or of
// { name } objects, so it works with both the profile skills shape and plain lists.
export function SkillChips({ skills = [], empty = 'No skills added yet.', className = '' }) {
  const names = skills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
  if (names.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {names.map((name) => (
        <span
          key={name}
          className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
        >
          {name}
        </span>
      ))}
    </div>
  );
}
