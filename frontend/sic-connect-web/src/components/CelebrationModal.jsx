import { useEffect } from 'react';

// Rewarding-but-not-intrusive celebration modal for badge unlocks and XP milestones.
// Controlled: render when `open` is true and provide `onClose`. Uses only built-in
// animations so it has no external dependencies.

const RARITY = {
  Common: { ring: 'ring-slate-300', text: 'text-slate-600', bg: 'bg-slate-100', glow: 'rgba(148,163,184,0.45)' },
  Rare: { ring: 'ring-brand-400', text: 'text-brand-700', bg: 'bg-brand-50', glow: 'rgba(20,40,160,0.35)' },
  Epic: { ring: 'ring-purple-400', text: 'text-purple-700', bg: 'bg-purple-50', glow: 'rgba(139,92,246,0.45)' },
  Legendary: { ring: 'ring-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', glow: 'rgba(245,158,11,0.55)' },
};

export function CelebrationModal({ open, onClose, title = 'Achievement unlocked!', message, xp, badge }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const rarity = RARITY[badge?.rarity] || RARITY.Rare;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm scale-100 rounded-2xl bg-white p-6 text-center shadow-2xl transition-transform"
        style={{ animation: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">🎉 {title}</p>

        {badge && (
          <div className="mt-4 flex flex-col items-center">
            <div
              className={`flex h-20 w-20 animate-bounce items-center justify-center rounded-full text-4xl ring-4 ${rarity.ring} ${rarity.bg}`}
              style={{ boxShadow: `0 0 32px ${rarity.glow}` }}
            >
              {badge.icon || '🏆'}
            </div>
            <span className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${rarity.bg} ${rarity.text}`}>
              {badge.rarity || 'Rare'}
            </span>
            <h3 className="mt-2 text-lg font-bold text-slate-900">{badge.title}</h3>
            {badge.description && <p className="mt-1 text-sm text-slate-500">{badge.description}</p>}
          </div>
        )}

        {message && !badge && <p className="mt-4 text-sm text-slate-600">{message}</p>}

        {xp != null && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
            <span className="animate-pulse">＋{xp} XP</span>
          </div>
        )}

        <button className="btn-primary mt-6 w-full" type="button" onClick={onClose}>
          Awesome!
        </button>
      </div>
    </div>
  );
}
