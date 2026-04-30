'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { WrappedSummary } from '@/lib/wrapped';

function formatWatchTime(seconds: number): string {
  if (seconds <= 0) return '0h';
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

export default function WrappedWidget() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WrappedSummary | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch('/api/wrapped')
      .then((r) => (r.ok ? (r.json() as Promise<WrappedSummary>) : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden animate-pulse">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
          <div className="w-4 h-4 rounded bg-(--color-border)" />
          <div className="w-32 h-4 rounded bg-(--color-border)" />
        </div>
        <div className="grid grid-cols-2 divide-x divide-(--color-border)">
          <div className="p-4 h-20" />
          <div className="p-4 h-20" />
        </div>
      </div>
    );
  }

  if (!data || data.totalPlays === 0) return null;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-(--color-accent)">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
          <p className="text-sm font-semibold text-(--color-text)">{year} Wrapped</p>
        </div>
        <Link href="/wrapped" className="text-xs text-(--color-accent) hover:underline font-medium">
          See your review
        </Link>
      </div>

      <div className="grid grid-cols-2 divide-x divide-(--color-border)">
        <div className="p-4">
          <p className="text-xs text-(--color-text-muted) mb-1">Plays This Year</p>
          <p className="text-2xl font-bold text-(--color-text) tabular-nums">
            {data.totalPlays.toLocaleString()}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-(--color-text-muted) mb-1">Watch Time</p>
          <p className="text-2xl font-bold text-(--color-accent)">
            {formatWatchTime(data.totalSeconds)}
          </p>
        </div>
      </div>

      {(data.topShows[0] || data.topMovies[0]) && (
        <div className="px-4 pb-3 pt-1 flex items-center gap-1.5 border-t border-(--color-border)">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-(--color-accent) shrink-0">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
          <p className="text-xs text-(--color-text-muted) truncate">
            Top pick:{' '}
            <span className="font-medium text-(--color-text)">
              {data.topShows[0]?.title ?? data.topMovies[0]?.title ?? '—'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
