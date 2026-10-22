import { useLeaderboard } from '../features/leaderboard/api.js';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

/** Rank medal for the top three; plain "#n" otherwise. */
function rankBadge(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function Row({ entry, highlight }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-2 ${
        highlight ? 'bg-brand-50 ring-1 ring-brand-200' : ''
      }`}
    >
      <div className="w-7 shrink-0 text-center text-sm font-bold text-slate-500">
        {rankBadge(entry.rank)}
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
        {initials(entry.fullName) || '👤'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-800">
          {entry.fullName}
          {entry.isMe && <span className="ml-1 text-xs font-semibold text-brand-600">(you)</span>}
        </div>
        <div className="truncate text-xs text-slate-400">{entry.headline || entry.cohort || 'SIC alumnus'}</div>
      </div>
      <div className="shrink-0 text-sm font-bold text-brand-600">{entry.xp.toLocaleString()} XP</div>
    </div>
  );
}

/**
 * Right-rail recognition leaderboard. `board` is 'alumni' or 'mentor'. Shows the top N
 * competitors and, when the viewer is outside the top N, a pinned "You are ranked #N" row.
 */
export function LeaderboardPanel({ board = 'alumni', title }) {
  const { data, isLoading, isError } = useLeaderboard(board);

  const heading = title || (board === 'mentor' ? 'Mentor Leaderboard' : 'Alumni Leaderboard');
  const top = data?.top || [];
  const me = data?.me || null;
  const meInTop = me && top.some((e) => e.userId === me.userId);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">🏆 {heading}</h3>
        {typeof data?.totalCompetitors === 'number' && data.totalCompetitors > 0 && (
          <span className="text-xs text-slate-400">{data.totalCompetitors} competing</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading rankings…</p>
      ) : isError ? (
        <p className="text-sm text-slate-400">Leaderboard is unavailable right now.</p>
      ) : top.length === 0 ? (
        <p className="text-sm text-slate-400">
          No rankings yet — earn XP by completing your profile, adding projects, certifications,
          connecting, and attending events.
        </p>
      ) : (
        <>
          <div className="space-y-1">
            {top.map((entry) => (
              <Row key={entry.userId} entry={entry} highlight={entry.isMe} />
            ))}
          </div>

          {me && !meInTop && (
            <>
              <div className="my-2 border-t border-dashed border-slate-200" />
              <Row entry={me} highlight />
              <p className="mt-2 text-center text-xs text-slate-500">
                You are ranked <span className="font-bold text-brand-600">#{me.rank}</span> of{' '}
                {data.totalCompetitors}.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
