import { useState } from 'react';
import { DEMO_ACCOUNTS } from './data.js';

/**
 * Thin strip shown above the app in the demo build, so visitors know the data is fictional,
 * that changes stay in their own browser, and how to start over.
 */
export function DemoBanner() {
  const [confirming, setConfirming] = useState(false);

  const reset = async () => {
    const { resetDemo } = await import('./mockServer.js');
    resetDemo();
    try {
      localStorage.removeItem('sic_connect_token');
      localStorage.removeItem('sic_connect_user');
    } catch {
      /* ignore */
    }
    window.location.assign(import.meta.env.BASE_URL);
  };

  return (
    <div className="bg-slate-900 px-4 py-2 text-xs text-slate-100 sm:text-sm" role="note">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p>
          <span className="font-semibold text-white">Live demo.</span> All people and data are fictional, and your
          changes are saved only in this browser.
        </p>
        {confirming ? (
          <span className="flex items-center gap-2">
            <span>Restore the original sample data?</span>
            <button type="button" onClick={reset} className="rounded bg-white px-2 py-0.5 font-semibold text-slate-900 hover:bg-slate-200">
              Reset
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded px-2 py-0.5 underline hover:text-white">
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="underline underline-offset-2 hover:text-white">
            Reset demo data
          </button>
        )}
      </div>
    </div>
  );
}

/** One-click sign-in buttons for the three demo roles, shown on the login page. */
export function DemoAccounts({ onSelect, disabled }) {
  return (
    <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Explore the demo</p>
      <p className="mt-1 text-xs text-slate-500">Sign in instantly as one of these fictional accounts.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.role}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(a)}
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-400 disabled:opacity-50"
          >
            <span className="block font-semibold text-brand-700">{a.role}</span>
            <span className="block truncate text-xs text-slate-500">{a.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Other demo people use the password <code className="rounded bg-white px-1">Demo#12345</code>.
      </p>
    </div>
  );
}
