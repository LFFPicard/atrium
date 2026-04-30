'use client';

import { useState, useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MessageWithUsers {
  id: string;
  fromUserId: string;
  toUserId: string | null;
  subject: string;
  body: string;
  read: boolean;
  createdAt: number;
  fromUsername: string;
  fromRole: string;
  toUsername: string | null;
}

interface UserOption {
  id: string;
  username: string;
}

interface Props {
  userId: string;
  userRole: string;
  username: string;
  allUsers: UserOption[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(unix: number): string {
  const d = new Date(unix * 1000);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffH < 48) return 'Yesterday';
  if (diffH < 7 * 24) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function preview(body: string): string {
  const single = body.replace(/\s+/g, ' ').trim();
  return single.length > 72 ? `${single.slice(0, 72)}…` : single;
}

const avatarColors = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-orange-600', 'bg-pink-600', 'bg-cyan-600',
];

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const color = avatarColors[(name.charCodeAt(0) ?? 0) % avatarColors.length];
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${cls} ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none`}>
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ── Compose Modal ─────────────────────────────────────────────────────────────

interface ComposeState {
  toUserId: string | null;
  subject: string;
  body: string;
}

function ComposeModal({
  isAdmin,
  allUsers,
  initial,
  onClose,
  onSent,
}: {
  isAdmin: boolean;
  allUsers: UserOption[];
  initial: ComposeState;
  onClose: () => void;
  onSent: () => void;
}) {
  const [toUserId, setToUserId] = useState<string>(initial.toUserId ?? '');
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const subjectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    subjectRef.current?.focus();
  }, []);

  async function handleSend() {
    if (!subject.trim()) { setError('Subject is required.'); return; }
    if (!body.trim()) { setError('Message body is required.'); return; }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: isAdmin && toUserId ? toUserId : null,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? 'Failed to send.');
        return;
      }
      onSent();
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onKeyDown={handleKey}>
      <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
          <h2 className="text-sm font-semibold text-(--color-text)">New Message</h2>
          <button
            onClick={onClose}
            className="text-(--color-text-muted) hover:text-(--color-text) transition-colors p-1 rounded hover:bg-(--color-bg)"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-4">
          {/* To */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-(--color-text-muted) w-14 shrink-0">To</label>
            {isAdmin ? (
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="flex-1 bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              >
                <option value="">All Admins</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-(--color-text-muted)">Admin</span>
            )}
          </div>

          {/* Subject */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-(--color-text-muted) w-14 shrink-0">Subject</label>
            <input
              ref={subjectRef}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
              className="flex-1 bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
            />
          </div>

          {/* Body */}
          <div className="flex gap-3">
            <label className="text-xs font-semibold text-(--color-text-muted) w-14 shrink-0 pt-2">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              rows={5}
              className="flex-1 bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-accent) resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 ml-[68px]">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-(--color-border)">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-(--color-text-muted) hover:text-(--color-text) transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSend()}
            disabled={sending}
            className="px-4 py-2 rounded-lg bg-(--color-button) text-(--color-button-text) text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inbox Item ────────────────────────────────────────────────────────────────

function InboxItem({
  msg,
  isSelected,
  isRead,
  userId,
  onClick,
}: {
  msg: MessageWithUsers;
  isSelected: boolean;
  isRead: boolean;
  userId: string;
  onClick: () => void;
}) {
  const isSent = msg.fromUserId === userId;
  const displayName = isSent
    ? (msg.toUsername ?? 'Admin')
    : msg.fromUsername;
  const prefix = isSent ? '→ ' : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 flex items-start gap-2.5 transition-colors border-b border-(--color-border) last:border-b-0 ${
        isSelected
          ? 'bg-(--color-accent)/10 border-l-2 border-l-(--color-accent)'
          : 'hover:bg-(--color-bg) border-l-2 border-l-transparent'
      }`}
    >
      {/* Unread dot */}
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isRead ? 'bg-transparent' : 'bg-(--color-accent)'}`} />

      <Avatar name={displayName} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className={`text-sm truncate ${isRead ? 'text-(--color-text-muted)' : 'text-(--color-text) font-semibold'}`}>
            {prefix}{displayName}
          </span>
          <span className="text-[10px] text-(--color-text-muted) shrink-0 tabular-nums">
            {formatTimestamp(msg.createdAt)}
          </span>
        </div>
        <p className={`text-xs truncate mb-0.5 ${isRead ? 'text-(--color-text-muted)' : 'text-(--color-text) font-medium'}`}>
          {msg.subject}
        </p>
        <p className="text-xs text-(--color-text-muted) truncate">{preview(msg.body)}</p>
      </div>
    </button>
  );
}

// ── Message Detail ────────────────────────────────────────────────────────────

function MessageDetail({
  msg,
  userId,
  userRole,
  onReply,
  onDelete,
  onBack,
}: {
  msg: MessageWithUsers;
  userId: string;
  userRole: string;
  onReply: (msg: MessageWithUsers) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const isSent = msg.fromUserId === userId;
  const canDelete = userRole === 'admin' || isSent || msg.toUserId === userId;

  function handleDelete() {
    if (!window.confirm('Delete this message?')) return;
    onDelete(msg.id);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-(--color-border) shrink-0">
        <button
          onClick={onBack}
          className="md:hidden text-(--color-text-muted) hover:text-(--color-text) transition-colors p-1 -ml-1"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="flex-1 text-sm font-semibold text-(--color-text) truncate">{msg.subject}</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onReply(msg)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--color-surface) border border-(--color-border) text-(--color-text) hover:border-(--color-accent) transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 00-4-4H4" />
            </svg>
            Reply
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-(--color-text-muted) hover:text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label="Delete"
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 py-3 border-b border-(--color-border) shrink-0 flex items-center gap-3">
        <Avatar name={msg.fromUsername} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold text-(--color-text)">{msg.fromUsername}</span>
            <span className="text-xs text-(--color-text-muted)">
              → {msg.toUsername ?? 'Admin'}
            </span>
          </div>
          <p className="text-xs text-(--color-text-muted)">
            {new Date(msg.createdAt * 1000).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-sm text-(--color-text) leading-relaxed whitespace-pre-wrap">{msg.body}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MessagesClient({ userId, userRole, username: _username, allUsers }: Props) {
  const isAdmin = userRole === 'admin';

  const [messages, setMessages] = useState<MessageWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [composeInitial, setComposeInitial] = useState<{ toUserId: string | null; subject: string; body: string }>({
    toUserId: null, subject: '', body: '',
  });

  // Mobile: true = show detail panel
  const [mobileDetail, setMobileDetail] = useState(false);

  useEffect(() => {
    void loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch('/api/messages');
      if (res.ok) setMessages((await res.json()) as MessageWithUsers[]);
    } finally {
      setLoading(false);
    }
  }

  function isRead(msg: MessageWithUsers): boolean {
    return msg.read || readIds.has(msg.id);
  }

  async function selectMessage(msg: MessageWithUsers) {
    setSelectedId(msg.id);
    setMobileDetail(true);
    if (!isRead(msg)) {
      setReadIds((prev) => new Set(prev).add(msg.id));
      await fetch(`/api/messages/${msg.id}`);
    }
  }

  function openCompose(initial?: { toUserId: string | null; subject: string }) {
    setComposeInitial({ toUserId: initial?.toUserId ?? null, subject: initial?.subject ?? '', body: '' });
    setComposing(true);
  }

  function openReply(msg: MessageWithUsers) {
    const replyTo = isAdmin && msg.fromUserId !== userId ? msg.fromUserId : null;
    const replySubject = msg.subject.startsWith('Re: ') ? msg.subject : `Re: ${msg.subject}`;
    openCompose({ toUserId: replyTo, subject: replySubject });
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setMobileDetail(false);
      }
    }
  }

  async function handleSent() {
    setComposing(false);
    await loadMessages();
  }

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {composing && (
        <ComposeModal
          isAdmin={isAdmin}
          allUsers={allUsers}
          initial={composeInitial}
          onClose={() => setComposing(false)}
          onSent={() => void handleSent()}
        />
      )}

      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 160px)', minHeight: 500 }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border) shrink-0">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className="text-sm font-semibold text-(--color-text)">
              Inbox {messages.filter((m) => !isRead(m) && (m.toUserId === userId || (isAdmin && m.toUserId === null)) && m.fromUserId !== userId).length > 0 && (
                <span className="ml-1 text-xs font-bold text-(--color-accent)">
                  ({messages.filter((m) => !isRead(m) && (m.toUserId === userId || (isAdmin && m.toUserId === null)) && m.fromUserId !== userId).length})
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => openCompose()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--color-button) text-(--color-button-text) text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Compose
          </button>
        </div>

        {/* Two-panel body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — inbox list */}
          <div className={`${mobileDetail ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 shrink-0 border-r border-(--color-border) overflow-y-auto`}>
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-2.5 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-(--color-border) shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-(--color-border) rounded w-3/4" />
                      <div className="h-3 bg-(--color-border) rounded w-full" />
                      <div className="h-3 bg-(--color-border) rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-(--color-text-muted) mb-3">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <p className="text-sm font-medium text-(--color-text) mb-1">No messages yet</p>
                <p className="text-xs text-(--color-text-muted) mb-4">
                  {isAdmin ? 'Messages from users will appear here.' : 'Send a message to your admin.'}
                </p>
                <button
                  onClick={() => openCompose()}
                  className="text-xs font-semibold text-(--color-accent) hover:underline"
                >
                  Compose one →
                </button>
              </div>
            ) : (
              messages.map((msg) => (
                <InboxItem
                  key={msg.id}
                  msg={msg}
                  isSelected={msg.id === selectedId}
                  isRead={isRead(msg)}
                  userId={userId}
                  onClick={() => void selectMessage(msg)}
                />
              ))
            )}
          </div>

          {/* Right — detail / empty state */}
          <div className={`${mobileDetail ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
            {selected ? (
              <MessageDetail
                msg={{ ...selected, read: isRead(selected) }}
                userId={userId}
                userRole={userRole}
                onReply={openReply}
                onDelete={(id) => void handleDelete(id)}
                onBack={() => { setMobileDetail(false); setSelectedId(null); }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-(--color-text-muted) mb-4">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <p className="text-sm font-medium text-(--color-text) mb-1">Select a message</p>
                <p className="text-xs text-(--color-text-muted)">Choose a message from the list to read it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
