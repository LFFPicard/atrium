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

interface HomeStatRow {
  user: string;
  friendly_name: string;
  total_plays: number;
}

interface HomeStatsResponse {
  response?: { data?: Array<{ stat_id: string; rows: HomeStatRow[] }> };
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

export default function StatsWidget({ isAdmin = false }: { isAdmin?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [plays30, setPlays30] = useState<number | null>(null);
  const [seconds30, setSeconds30] = useState<number | null>(null);
  const [plays7, setPlays7] = useState<number | null>(null);
  const [topUser, setTopUser] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const fetches: Promise<void>[] = [
          fetch('/api/modules/tautulli?cmd=get_plays_by_date&time_range=30')
            .then((r) => r.ok ? r.json() : null)
            .then((d: PlaysResponse | null) => { if (d) setPlays30(sumSeries(d)); }),
          fetch('/api/modules/tautulli?cmd=get_plays_by_date&time_range=30&y_axis=duration')
            .then((r) => r.ok ? r.json() : null)
            .then((d: PlaysResponse | null) => { if (d) setSeconds30(sumSeries(d)); }),
          fetch('/api/modules/tautulli?cmd=get_plays_by_date&time_range=7')
            .then((r) => r.ok ? r.json() : null)
            .then((d: PlaysResponse | null) => { if (d) setPlays7(sumSeries(d)); }),
        ];

        if (isAdmin) {
          fetches.push(
            fetch('/api/modules/tautulli?cmd=get_home_stats&stat_id=top_users&stats_count=1&time_range=30')
              .then((r) => r.ok ? r.json() : null)
              .then((d: HomeStatsResponse | null) => {
                const rows = d?.response?.data?.find((s) => s.stat_id === 'top_users')?.rows ?? [];
                const top = rows[0];
                if (top) setTopUser(top.friendly_name || top.user);
              }),
          );
        }

        await Promise.all(fetches);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden animate-pulse">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
          <div className="w-4 h-4 rounded bg-(--color-border)" />
          <div className="w-28 h-4 rounded bg-(--color-border)" />
        </div>
        <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-3'} divide-x divide-(--color-border)`}>
          {Array.from({ length: isAdmin ? 4 : 3 }).map((_, i) => (
            <div key={i} className="p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (plays30 === null && seconds30 === null) return null;

  const cells = isAdmin
    ? [
        { label: 'Total Plays', value: plays30 !== null ? plays30.toLocaleString() : '—' },
        { label: 'Watch Time', value: seconds30 !== null && seconds30 > 0 ? formatDuration(seconds30) : '—' },
        { label: 'Streams This Week', value: plays7 !== null ? plays7.toLocaleString() : '—' },
        { label: 'Top User (30d)', value: topUser ?? '—' },
      ]
    : [
        { label: 'Total Plays', value: plays30 !== null ? plays30.toLocaleString() : '—' },
        { label: 'Watch Time', value: seconds30 !== null && seconds30 > 0 ? formatDuration(seconds30) : '—' },
        { label: 'Streams This Week', value: plays7 !== null ? plays7.toLocaleString() : '—' },
      ];

  const gridCols = isAdmin ? 'grid-cols-2' : 'grid-cols-3';

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

      <div className={`grid ${gridCols} divide-x divide-(--color-border) ${isAdmin ? 'divide-y' : ''}`}>
        {cells.map((cell) => (
          <div key={cell.label} className="p-4">
            <p className="text-xs text-(--color-text-muted) mb-1">{cell.label}</p>
            <p className="text-2xl font-bold text-(--color-text) tabular-nums truncate">{cell.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
