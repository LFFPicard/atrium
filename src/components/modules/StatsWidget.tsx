'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PlaysResponse {
  response?: {
    data?: {
      series?: Array<{ name: string; data: number[] }>;
    };
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

function sumSeries(resp: PlaysResponse): number {
  return (resp?.response?.data?.series ?? []).reduce(
    (acc, s) => acc + s.data.reduce((a, b) => a + b, 0),
    0,
  );
}

export default function StatsWidget() {
  const [loading, setLoading] = useState(true);
  const [plays, setPlays] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [playsRes, durRes] = await Promise.all([
          fetch('/api/modules/tautulli?cmd=get_plays_by_date&time_range=30'),
          fetch('/api/modules/tautulli?cmd=get_plays_by_date&time_range=30&y_axis=duration'),
        ]);
        if (playsRes.ok) setPlays(sumSeries((await playsRes.json()) as PlaysResponse));
        if (durRes.ok) setSeconds(sumSeries((await durRes.json()) as PlaysResponse));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden animate-pulse">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
          <div className="w-4 h-4 rounded bg-(--color-border)" />
          <div className="w-28 h-4 rounded bg-(--color-border)" />
        </div>
        <div className="grid grid-cols-2 divide-x divide-(--color-border)">
          <div className="p-4 h-20" />
          <div className="p-4 h-20" />
        </div>
      </div>
    );
  }

  if (plays === null && seconds === null) return null;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p className="text-sm font-semibold text-(--color-text)">Stats — Last 30 Days</p>
        </div>
        <Link href="/stats" className="text-xs text-(--color-accent) hover:underline font-medium">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 divide-x divide-(--color-border)">
        <div className="p-4">
          <p className="text-xs text-(--color-text-muted) mb-1">Total Plays</p>
          <p className="text-2xl font-bold text-(--color-text) tabular-nums">
            {plays !== null ? plays.toLocaleString() : '—'}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-(--color-text-muted) mb-1">Watch Time</p>
          <p className="text-2xl font-bold text-(--color-text)">
            {seconds !== null && seconds > 0 ? formatDuration(seconds) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
