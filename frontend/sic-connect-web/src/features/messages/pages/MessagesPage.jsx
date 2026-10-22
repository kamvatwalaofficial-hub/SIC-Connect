import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { formatRelative } from '../../../lib/constants.js';
import { useConnections } from '../../networking/api.js';
import { useConversations, useSendMessage, useThread } from '../api.js';

const REL_TONE = { Mentee: 'purple', Mentor: 'amber', Connection: 'slate' };

/** Relationship of a counterpart based on accepted connections: Mentee | Mentor | Connection. */
function relationshipOf(connections, otherId) {
  const c = (connections || []).find((x) => x.counterpartUserId === otherId && x.status === 'Accepted');
  if (!c) return null;
  if (c.type === 'Mentorship') return c.isIncoming ? 'Mentee' : 'Mentor';
  return 'Connection';
}

function RelationshipBadge({ relationship }) {
  if (!relationship) return null;
  return <Badge tone={REL_TONE[relationship] || 'slate'}>{relationship}</Badge>;
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Avatar({ name, size = 'h-10 w-10' }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700`}>
      {initials(name) || '👤'}
    </div>
  );
}

function timeOf(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function ConversationList({ conversations, activeId, onSelect, search, setSearch, relFor }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-3">
        <input
          className="input"
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-400">No conversations yet.</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.otherUserId}
              type="button"
              onClick={() => onSelect(c.otherUserId)}
              className={`flex w-full items-center gap-3 border-b border-slate-50 p-3 text-left hover:bg-slate-50 ${
                activeId === c.otherUserId ? 'bg-brand-50' : ''
              }`}
            >
              <Avatar name={c.otherName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-slate-800">{c.otherName}</span>
                    <RelationshipBadge relationship={relFor(c.otherUserId)} />
                  </span>
                  {c.lastAt && <span className="shrink-0 text-[11px] text-slate-400">{formatRelative(c.lastAt)}</span>}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-slate-500">{c.lastMessage || 'Start a conversation'}</span>
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ChatWindow({ otherUserId, onBack, relationship }) {
  const { data: thread, isLoading } = useThread(otherUserId);
  const send = useSendMessage(otherUserId);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

  const onSend = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    send.mutate(body, { onSuccess: () => setText('') });
  };

  if (isLoading) return <Spinner label="Loading conversation…" />;
  if (!thread) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 p-3">
        <button className="btn-secondary lg:hidden" onClick={onBack} type="button" aria-label="Back">←</button>
        <Avatar name={thread.otherName} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{thread.otherName}</span>
            <RelationshipBadge relationship={relationship} />
          </div>
          <div className="text-xs text-slate-500">{thread.otherHeadline || (thread.isConnected ? 'Connected' : 'Not connected')}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
        {thread.messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-400">
            {thread.isConnected ? 'Say hello 👋' : 'You can message once you are connected.'}
          </p>
        ) : (
          thread.messages.map((m) => (
            <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.isMine ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-slate-800 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <div className={`mt-1 flex items-center gap-1 text-[10px] ${m.isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                  <span>{timeOf(m.sentAt)}</span>
                  {m.isMine && <span>· {m.readAt ? '✓✓ Read' : '✓ Sent'}</span>}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={onSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          className="input"
          placeholder={thread.isConnected ? 'Type a message…' : 'Connect first to send a message'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!thread.isConnected}
        />
        <button className="btn-primary" type="submit" disabled={!thread.isConnected || send.isPending || !text.trim()}>
          Send
        </button>
      </form>
      {send.isError && <p className="px-3 pb-2 text-xs text-red-600">{send.error.message}</p>}
    </div>
  );
}

export function MessagesPage() {
  const { data: conversations, isLoading } = useConversations();
  const { data: connections } = useConnections();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const relFor = (userId) => relationshipOf(connections, userId);
  const activeId = params.get('to') ? Number(params.get('to')) : null;
  const select = (id) => setParams(id ? { to: String(id) } : {});

  const filtered = useMemo(() => {
    const list = conversations || [];
    const q = search.trim().toLowerCase();
    return q ? list.filter((c) => c.otherName.toLowerCase().includes(q)) : list;
  }, [conversations, search]);

  if (isLoading) return <Spinner label="Loading messages…" />;

  const hasAny = (conversations || []).length > 0;

  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat securely with your connections and mentors." />

      {!hasAny ? (
        <EmptyState
          title="No conversations yet"
          message="Connect with mentors and alumni to start messaging. Accepted connections appear here."
        />
      ) : (
        <div className="card grid h-[70vh] grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr]">
          {/* List: hidden on mobile when a chat is open */}
          <div className={`border-r border-slate-100 ${activeId ? 'hidden lg:block' : 'block'}`}>
            <ConversationList
              conversations={filtered}
              activeId={activeId}
              onSelect={select}
              search={search}
              setSearch={setSearch}
              relFor={relFor}
            />
          </div>

          {/* Chat: hidden on mobile until a chat is selected */}
          <div className={`${activeId ? 'block' : 'hidden lg:block'}`}>
            {activeId ? (
              <ChatWindow otherUserId={activeId} onBack={() => select(null)} relationship={relFor(activeId)} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
