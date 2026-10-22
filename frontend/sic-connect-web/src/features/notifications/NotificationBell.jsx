import { useEffect, useRef, useState } from 'react';
import { Bell } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../lib/constants.js';
import { useMarkAllRead, useMarkNotificationRead, useNotifications, useUnreadCount } from './api.js';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const { data: unread = 0 } = useUnreadCount();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onItemClick = (n) => {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100"
  onClick={() => setOpen((o) => !o)}
  type="button"
  aria-label="Notifications"
>
<Bell size={18} strokeWidth={2} className="text-slate-700" />

  {unread > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {unread > 9 ? "9+" : unread}
    </span>
  )}
</button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unread > 0 && (
              <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => markAll.mutate()} type="button">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">You’re all caught up 🎉</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  type="button"
                  className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${
                    n.isRead ? '' : 'bg-brand-50/40'
                  }`}
                >
                  <span className="flex items-start gap-2 text-sm text-slate-700">
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    <span>{n.message}</span>
                  </span>
                  <span className="pl-4 text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
