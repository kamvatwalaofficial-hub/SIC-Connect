import { useMemo, useState } from 'react';
import { SKILLS_CATALOG } from '../lib/skillsCatalog.js';

/**
 * Searchable multi-select for skills. `value` is an array of skill-name strings;
 * `onChange(nextArray)` fires on every toggle. Predefined skills come from the
 * catalogue; any pre-existing custom skills are preserved and a custom skill can be
 * added via the search box, keeping this fully backward-compatible with free-text data.
 */
export function SkillSelect({ value = [], onChange }) {
  const [query, setQuery] = useState('');
  const selected = value;

  // Catalogue plus any already-selected skills that aren't in the catalogue.
  const options = useMemo(() => {
    const extras = selected.filter((s) => !SKILLS_CATALOG.includes(s));
    return [...SKILLS_CATALOG, ...extras];
  }, [selected]);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((s) => s.toLowerCase().includes(q)) : options;
  const canAddCustom = q && !options.some((s) => s.toLowerCase() === q);

  const toggle = (skill) => {
    onChange(selected.includes(skill) ? selected.filter((s) => s !== skill) : [...selected, skill]);
  };
  const addCustom = () => {
    const name = query.trim();
    if (name && !selected.includes(name)) onChange([...selected, name]);
    setQuery('');
  };

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
              title="Remove"
            >
              {s} <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          className="input"
          placeholder="Search skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canAddCustom) { e.preventDefault(); addCustom(); } }}
        />
      </div>

      {/* Checkbox list */}
      <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200 p-2">
        {canAddCustom && (
          <button
            type="button"
            onClick={addCustom}
            className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-brand-700 hover:bg-brand-50"
          >
            <span className="text-base leading-none">＋</span> Add “{query.trim()}”
          </button>
        )}
        {filtered.length === 0 && !canAddCustom ? (
          <p className="px-2 py-1.5 text-sm text-slate-400">No matching skills.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
            {filtered.map((skill) => {
              const on = selected.includes(skill);
              return (
                <li key={skill}>
                  <label className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 ${on ? 'text-slate-900' : 'text-slate-600'}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(skill)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {skill}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">{selected.length} selected · click a chip to remove</p>
    </div>
  );
}
