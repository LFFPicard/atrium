'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Status: 1=pending, 2=approved, 3=declined, 4=available, 5=processing
interface OverseerrMedia {
  id: number;
  mediaType: 'movie' | 'tv';
  tmdbId?: number;
  title?: string;
  originalTitle?: string;
}

interface OverseerrRequest {
  id: number;
  status: number;
  requestedBy: { username: string; displayName?: string };
  media: OverseerrMedia;
  createdAt: string;
}

interface OverseerrResponse {
  pageInfo: { results: number };
  results: OverseerrRequest[];
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 3600) return `${Math.max(1, Math.floor(secs / 60))}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Declined',
  4: 'Available',
  5: 'Processing',
};

const STATUS_CLASSES: Record<number, string> = {
  1: 'bg-amber-500/15 text-amber-400',
  2: 'bg-blue-500/15 text-blue-400',
  3: 'bg-red-500/15 text-red-400',
  4: 'bg-emerald-500/15 text-emerald-400',
  5: 'bg-purple-500/15 text-purple-400',
};

export default function OverseerrWidget({ isAdmin, username }: { isAdmin: boolean; username: string }) {
  const [requests, setRequests] = useState<OverseerrRequest[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/modules/overseerr?endpoint=requests&filter=all&sort=added&take=10&skip=0');
        if (!res.ok) return;
        const data: OverseerrResponse = await res.json();
        const all = data.results ?? [];
        if (isAdmin) {
          setRequests(all.slice(0, 5));
        } else {
          const own = all.filter(
            (r) => r.requestedBy.username === username || (r.requestedBy.displayName ?? '') === username,
          );
          setRequests(own.slice(0, 5));
        }
      } catch {
        // module not configured — widget stays hidden
      }
    }
    void load();
  }, [isAdmin, username]);

  if (requests === null || requests.length === 0) return null;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
          <path d="M9 12h6M9 16h6M7 8h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
        <p className="text-sm font-semibold text-(--color-text)">Recent Requests</p>
        <Link href="/requests" className="ml-auto text-xs text-(--color-accent) hover:underline font-medium">
          View all
        </Link>
      </div>
      <div className="divide-y divide-(--color-border)">
        {requests.map((r) => {
          const title = r.media.title ?? (r.media.mediaType === 'movie' ? 'Movie' : 'TV Show');
          const requester = r.requestedBy.displayName || r.requestedBy.username;
          const statusLabel = STATUS_LABELS[r.status] ?? 'Unknown';
          const statusCls = STATUS_CLASSES[r.status] ?? 'bg-(--color-bg) text-(--color-text-muted)';
          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--color-bg) border border-(--color-border) text-(--color-text-muted) uppercase tracking-wide font-medium shrink-0">
                    {r.media.mediaType === 'movie' ? 'Movie' : 'TV'}
                  </span>
                  <p className="text-sm font-medium text-(--color-text) truncate">{title}</p>
                </div>
                <p className="text-xs text-(--color-text-muted)">
                  {requester} · {timeAgo(r.createdAt)}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
