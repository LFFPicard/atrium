'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { LinePoint, PlatformPoint } from './StatsCharts';

const PlaysLineChart = dynamic(
  () => import('./StatsCharts').then((m) => ({ default: m.PlaysLineChart })),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse bg-(--color-bg) rounded-lg" /> },
);

const PlatformBarChart = dynamic(
  () => import('./StatsCharts').then((m) => ({ default: m.PlatformBarChart })),
  { ssr: false, loading: () => <div className="h-[100px] animate-pulse bg-(--color-bg) rounded-lg" /> },
);

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlaysResponse {
  response?: {
    data?: {
      categories?: string[];
      series?: Array<{ name: string; data: number[] }>;
    };
  };
}

interface HomeStatItem {
  count?: number;
  duration?: number;
  friendly_name?: string;
  grandparent_title?: string;
  platform?: string;
  rating_key?: string;
  thumb?: string;
  title?: string;
  total_plays?: number;
}

interface HomeStatsResponse {
  response?: {
    data?: Array<{ stat_id: string; rows?: HomeStatItem[] }>;
  };
}

interface HeatPoint { label: string; value: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

function shortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

function sumSeries(resp: PlaysResponse): number {
  return (resp?.response?.data?.series ?? []).reduce(
    (acc, s) => acc + s.data.reduce((a, b) => a + b, 0),
    0,
  );
}

function buildLineData(resp: PlaysResponse): LinePoint[] {
  const cats = resp?.response?.data?.categories ?? [];
  const series = resp?.response?.data?.series ?? [];
  const tv = series.find((s) => s.name === 'TV');
  const movies = series.find((s) => s.name === 'Movies');
  return cats.map((date, i) => ({
    date: shortDate(date),
    TV: tv?.data[i] ?? 0,
    Movies: movies?.data[i] ?? 0,
  }));
}

function buildHeatData(resp: PlaysResponse): HeatPoint[] {
  const cats = resp?.response?.data?.categories ?? [];
  const series = resp?.response?.data?.series ?? [];
  return cats.map((label, i) => ({
    label,
    value: series.reduce((acc, s) => acc + (s.data[i] ?? 0), 0),
  }));
}

function heatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'var(--color-bg)';
  const pct = Math.max(10, Math.round((value / max) * 90));
  return `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-(--color-accent)/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-(--color-text-muted) mb-0.5">{label}</p>
        <p className="text-lg font-bold text-(--color-text) leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-(--color-text-muted) truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-(--color-border)">
        <p className="text-sm font-semibold text-(--color-text)">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Thumb({ src, alt }: { src?: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-8 h-12 bg-(--color-border) rounded shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-(--color-text-muted)">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 2v20M17 2v20M2 12h20" />
        </svg>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-8 h-12 object-cover rounded shrink-0" onError={() => setErr(true)} />;
}

function TopList({
  title,
  items,
  type = 'media',
}: {
  title: string;
  items: HomeStatItem[];
  type?: 'media' | 'user';
}) {
  return (
    <SectionCard title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted) text-center py-4">No data yet</p>
      ) : (
        <ol className="space-y-2.5">
          {items.map((item, i) => {
            const name =
              type === 'user'
                ? (item.friendly_name ?? 'Unknown')
                : (item.title ?? item.grandparent_title ?? 'Unknown');
            const plays = item.total_plays ?? item.count ?? 0;
            const thumbSrc =
              type !== 'user' && item.thumb
                ? `/api/modules/tautulli?cmd=get_image&img=${encodeURIComponent(item.thumb)}`
                : undefined;
            return (
              <li key={i} className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-(--color-text-muted) w-4 text-right shrink-0">
                  {i + 1}
                </span>
                {type === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-(--color-accent)/20 flex items-center justify-center shrink-0 text-xs font-bold text-(--color-accent)">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                ) : (
                  <Thumb src={thumbSrc} alt={name} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--color-text) truncate">{name}</p>
                  {item.duration !== undefined && item.duration > 0 && (
                    <p className="text-xs text-(--color-text-muted)">{formatDuration(item.duration)}</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-(--color-text-muted) shrink-0 tabular-nums">
                  {plays}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}

function DowHeatmap({ data }: { data: HeatPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <SectionCard title="Day of Week">
      <div className="grid grid-cols-7 gap-1.5">
        {data.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg"
            style={{ background: heatColor(value, max) }}
          >
            <span className="text-[10px] text-(--color-text)">{label.slice(0, 3)}</span>
            <span className="text-xs font-semibold text-(--color-text)">{value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function HodHeatmap({ data }: { data: HeatPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <SectionCard title="Time of Day">
      <div className="grid grid-cols-6 gap-1">
        {data.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 py-2 px-1 rounded"
            style={{ background: heatColor(value, max) }}
            title={`${label}: ${value} plays`}
          >
            <span className="text-[9px] text-(--color-text) leading-tight text-center">{label}</span>
            <span className="text-[10px] font-semibold text-(--color-text)">{value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  isAdmin: boolean;
  tautulliUserId: number | null;
}

export default function StatsClient({ isAdmin, tautulliUserId }: Props) {
  const [loading, setLoading] = useState(true);
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [lineData, setLineData] = useState<LinePoint[]>([]);
  const [dowData, setDowData] = useState<HeatPoint[]>([]);
  const [hodData, setHodData] = useState<HeatPoint[]>([]);
  const [topShows, setTopShows] = useState<HomeStatItem[]>([]);
  const [topMovies, setTopMovies] = useState<HomeStatItem[]>([]);
  const [topUsers, setTopUsers] = useState<HomeStatItem[]>([]);
  const [platformData, setPlatformData] = useState<PlatformPoint[]>([]);

  const userNotFound = !isAdmin && tautulliUserId === null;

  useEffect(() => {
    const uid = tautulliUserId ? `&user_id=${tautulliUserId}` : '';

    async function load() {
      try {
        const [playsRes, durRes, homeRes, dowRes, hodRes] = await Promise.all([
          fetch(`/api/modules/tautulli?cmd=get_plays_by_date&time_range=30${uid}`),
          fetch(`/api/modules/tautulli?cmd=get_plays_by_date&time_range=30&y_axis=duration${uid}`),
          fetch(`/api/modules/tautulli?cmd=get_home_stats&time_range=30&stats_count=5`),
          fetch(`/api/modules/tautulli?cmd=get_plays_by_dayofweek&time_range=30${uid}`),
          fetch(`/api/modules/tautulli?cmd=get_plays_by_hourofday&time_range=30${uid}`),
        ]);

        if (playsRes.ok) {
          const plays = (await playsRes.json()) as PlaysResponse;
          setTotalPlays(sumSeries(plays));
          setLineData(buildLineData(plays));
        }

        if (durRes.ok) {
          const dur = (await durRes.json()) as PlaysResponse;
          setTotalSeconds(sumSeries(dur));
        }

        if (homeRes.ok) {
          const home = (await homeRes.json()) as HomeStatsResponse;
          const stats = home?.response?.data ?? [];
          const find = (id: string) => stats.find((s) => s.stat_id === id)?.rows ?? [];
          setTopShows(find('top_tv').slice(0, 5));
          setTopMovies(find('top_movies').slice(0, 5));
          setTopUsers(find('top_users').slice(0, 5));
          setPlatformData(
            find('top_platforms')
              .slice(0, 8)
              .map((p) => ({
                platform: p.platform ?? p.title ?? 'Unknown',
                plays: p.total_plays ?? p.count ?? 0,
              })),
          );
        }

        if (dowRes.ok) {
          const dow = (await dowRes.json()) as PlaysResponse;
          setDowData(buildHeatData(dow));
        }

        if (hodRes.ok) {
          const hod = (await hodRes.json()) as PlaysResponse;
          setHodData(buildHeatData(hod));
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [tautulliUserId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-(--color-surface) border border-(--color-border) rounded-xl h-20" />
          ))}
        </div>
        <div className="bg-(--color-surface) border border-(--color-border) rounded-xl h-[280px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-(--color-surface) border border-(--color-border) rounded-xl h-32" />
          <div className="bg-(--color-surface) border border-(--color-border) rounded-xl h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-(--color-surface) border border-(--color-border) rounded-xl h-48" />
          <div className="bg-(--color-surface) border border-(--color-border) rounded-xl h-48" />
        </div>
      </div>
    );
  }

  const topShow = topShows[0];
  const topMovie = topMovies[0];
  const listCols = isAdmin && topUsers.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className="space-y-6">
      {userNotFound && (
        <div className="bg-(--color-accent)/10 border border-(--color-accent)/20 rounded-xl px-4 py-3 text-sm text-(--color-text-muted)">
          Your account wasn&apos;t found in Tautulli — showing server-wide stats instead.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={isAdmin ? 'Server Plays (30d)' : 'Your Plays (30d)'}
          value={totalPlays.toLocaleString()}
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-(--color-accent)">
              <path d="M8 5v14l11-7z" />
            </svg>
          }
        />
        <StatCard
          label="Watch Time (30d)"
          value={totalSeconds > 0 ? formatDuration(totalSeconds) : '—'}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-(--color-accent)">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatCard
          label="Top Show"
          value={topShow?.title ?? topShow?.grandparent_title ?? '—'}
          sub={topShow ? `${(topShow.total_plays ?? topShow.count ?? 0).toLocaleString()} plays` : undefined}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-(--color-accent)">
              <rect x="2" y="7" width="20" height="15" rx="2" />
              <path d="M17 2H7L5 7h14l-2-5z" />
            </svg>
          }
        />
        <StatCard
          label="Top Movie"
          value={topMovie?.title ?? '—'}
          sub={topMovie ? `${(topMovie.total_plays ?? topMovie.count ?? 0).toLocaleString()} plays` : undefined}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-(--color-accent)">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" />
            </svg>
          }
        />
      </div>

      {/* Play History */}
      {lineData.length > 0 && (
        <SectionCard
          title={`Play History — Last 30 Days${!isAdmin && !userNotFound ? ' (Your Activity)' : ' (Server)'}`}
        >
          <PlaysLineChart data={lineData} />
        </SectionCard>
      )}

      {/* Heatmaps */}
      {(dowData.length > 0 || hodData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dowData.length > 0 && <DowHeatmap data={dowData} />}
          {hodData.length > 0 && <HodHeatmap data={hodData} />}
        </div>
      )}

      {/* Top Lists */}
      <div className={`grid grid-cols-1 ${listCols} gap-6`}>
        <TopList title="Top Shows" items={topShows} />
        <TopList title="Top Movies" items={topMovies} />
        {isAdmin && topUsers.length > 0 && (
          <TopList title="Top Users" items={topUsers} type="user" />
        )}
      </div>

      {/* Platform Breakdown */}
      {platformData.length > 0 && (
        <SectionCard title="Platform Breakdown">
          <PlatformBarChart data={platformData} />
        </SectionCard>
      )}
    </div>
  );
}
