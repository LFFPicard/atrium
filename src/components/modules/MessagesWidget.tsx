'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UnreadMessage {
  id: string;
  fromUsername: string;
  subject: string;
  createdAt: number;
}

interface UnreadResponse {
  messages: UnreadMessage[];
  total: number;
}

function timeAgo(ts: number): string {
  const secs = Math.floor(Date.now() / 1000) - ts;
  if (secs < 3600) return `${Math.max(1, Math.floor(secs / 60))}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function initials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function MessagesWidget() {
  const [data, setData] = useState<UnreadResponse | null>(null);

  useEffect(() => {
    fetch('/api/messages/unread')
      .then((r) => r.ok ? r.json() : null)
      .then((d: UnreadResponse | null) => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data || data.total === 0) return null;

  return (
    <div className="mb-6 bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <p className="text-sm font-semibold text-(--color-text)">Messages</p>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-(--color-accent)/15 text-(--color-accent) font-medium">
          {data.total} unread
        </span>
        <Link href="/messages" className="ml-auto text-xs text-(--color-accent) hover:underline font-medium">
          View all
        </Link>
      </div>
      <div className="divide-y divide-(--color-border)">
        {data.messages.map((msg) => (
          <Link
            key={msg.id}
            href="/messages"
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-(--color-bg) transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-(--color-accent)/15 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-(--color-accent)">{initials(msg.fromUsername)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-(--color-text) truncate">{msg.subject}</p>
              <p className="text-xs text-(--color-text-muted)">
                {msg.fromUsername} · {timeAgo(msg.createdAt)}
              </p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-(--color-accent) shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
