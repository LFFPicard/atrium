'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OverseerrRequest {
  id: number;
  status: number;
  requestedBy: { username: string; displayName?: string };
}

interface OverseerrResponse {
  pageInfo: { results: number };
  results: OverseerrRequest[];
}

export default function OverseerrWidget({ isAdmin, username }: { isAdmin: boolean; username: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/modules/overseerr?endpoint=requests&filter=pending&take=100&skip=0');
        if (!res.ok) return;
        const data: OverseerrResponse = await res.json();
        if (isAdmin) {
          setCount(data.pageInfo.results);
        } else {
          const own = (data.results ?? []).filter(
            (r) => r.requestedBy.username === username || (r.requestedBy.displayName ?? '') === username,
          );
          setCount(own.length);
        }
      } catch {
        // module not configured — widget stays hidden
      }
    }
    load();
  }, [isAdmin, username]);

  if (count === null) return null;

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-(--color-accent)/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
              <path d="M9 12h6M9 16h6M7 8h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-(--color-text)">Requests</span>
        </div>
        <Link href="/requests" className="text-xs text-(--color-accent) hover:opacity-80 transition-opacity">
          View all
        </Link>
      </div>

      {count === 0 ? (
        <p className="text-sm text-(--color-text-muted)">No pending requests</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-(--color-text)">{count}</span>
            <span className="text-sm text-(--color-text-muted)">
              {isAdmin ? 'pending approval' : count === 1 ? 'pending request' : 'pending requests'}
            </span>
          </div>
          {isAdmin && (
            <Link
              href="/requests"
              className="inline-flex items-center gap-1 text-xs font-medium text-(--color-accent) hover:opacity-80 transition-opacity mt-1"
            >
              Review requests
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
