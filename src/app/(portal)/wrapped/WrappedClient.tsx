'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { WrappedSummary, WrappedMediaItem, PlatformCount } from '@/lib/wrapped';
import type { MonthPoint } from './WrappedCharts';

const MonthlyBarChart = dynamic(
  () => import('./WrappedCharts').then((m) => ({ default: m.MonthlyBarChart })),
  { ssr: false, loading: () => <div className="h-40 animate-pulse bg-(--color-bg) rounded-lg" /> },
);

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatWatchTime(seconds: number): string {
  if (seconds <= 0) return '0h';
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

function imgSrc(thumb: string | null): string | undefined {
  if (!thumb) return undefined;
  return `/api/modules/tautulli?cmd=get_image&img=${encodeURIComponent(thumb)}`;
}

function heatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'var(--color-bg)';
  const pct = Math.max(10, Math.round((value / max) * 90));
  return `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`;
}

function hourLabel(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function PosterImg({ thumb, alt, className }: { thumb: string | null; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  const src = imgSrc(thumb);
  if (!src || err) {
    return (
      <div className={`${className} bg-(--color-border) flex items-center justify-center rounded`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-(--color-text-muted)">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 2v20M17 2v20M2 12h20" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`${className} object-cover rounded`} onError={() => setErr(true)} />
  );
}

function SectionWrapper({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-(--color-border) overflow-hidden ${accent ? 'bg-(--color-accent)/5' : 'bg-(--color-surface)'}`}>
      {children}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-(--color-accent) mb-2">{text}</p>
  );
}

// ── Section: Hero ─────────────────────────────────────────────────────────────

function HeroSection({ data }: { data: WrappedSummary }) {
  return (
    <SectionWrapper accent>
      <div className="px-6 py-8 text-center relative">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-(--color-accent)/20 border border-(--color-accent)/30">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-(--color-accent)">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
          <span className="text-xs font-bold text-(--color-accent)">{data.year} Wrapped</span>
        </div>

        <h2 className="text-2xl font-bold text-(--color-text) mb-1">Your Year in Review</h2>
        <p className="text-sm text-(--color-text-muted) mb-8">Here&apos;s what you watched in {data.year}</p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
            <p className="text-xs text-(--color-text-muted) mb-1">Total Plays</p>
            <p className="text-4xl font-black text-(--color-text) tabular-nums leading-none">{data.totalPlays.toLocaleString()}</p>
          </div>
          <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
            <p className="text-xs text-(--color-text-muted) mb-1">Watch Time</p>
            <p className="text-4xl font-black text-(--color-accent) leading-none">{formatWatchTime(data.totalSeconds)}</p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ── Section: Top Media (shared for shows + movies) ────────────────────────────

function TopPoster({ item, rank }: { item: WrappedMediaItem; rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex gap-4 items-end">
        <div className="relative shrink-0">
          <PosterImg thumb={item.thumb} alt={item.title} className="w-32 aspect-2/3" />
          <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-(--color-accent) text-(--color-accent-text) text-xs font-black flex items-center justify-center shadow">1</span>
        </div>
        <div className="pb-1 min-w-0">
          <p className="text-base font-bold text-(--color-text) leading-tight mb-1 line-clamp-3">{item.title}</p>
          <p className="text-sm font-semibold text-(--color-accent)">{item.plays.toLocaleString()} plays</p>
          <p className="text-xs text-(--color-text-muted) mt-1">#1 {item.mediaType === 'show' ? 'show' : 'movie'} this year</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-semibold text-(--color-text-muted) w-4 text-right shrink-0">{rank}</span>
      <PosterImg thumb={item.thumb} alt={item.title} className="w-10 aspect-2/3 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-(--color-text) truncate">{item.title}</p>
        <p className="text-xs text-(--color-text-muted)">{item.plays} plays</p>
      </div>
    </div>
  );
}

function TopMediaSection({ items, label }: { items: WrappedMediaItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <SectionWrapper>
      <div className="px-4 pt-5 pb-2 border-b border-(--color-border)">
        <SectionLabel text={label} />
      </div>
      <div className="p-4 space-y-5">
        {items[0] && <TopPoster item={items[0]} rank={1} />}
        {items.length > 1 && (
          <div className="space-y-2.5 pt-2 border-t border-(--color-border)">
            {items.slice(1).map((item, i) => (
              <TopPoster key={i} item={item} rank={i + 2} />
            ))}
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

// ── Section: Watching Patterns ────────────────────────────────────────────────

function PatternsSection({ data }: { data: WrappedSummary }) {
  const { dowData, hodData, mostActiveDayIndex, mostActiveHour } = data;
  const dowMax = Math.max(...dowData, 1);
  const hodMax = Math.max(...hodData, 1);

  return (
    <SectionWrapper>
      <div className="px-4 pt-5 pb-2 border-b border-(--color-border)">
        <SectionLabel text="Watching Patterns" />
      </div>
      <div className="p-4 space-y-5">
        {/* Peak day + hour highlight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-(--color-bg) rounded-xl p-3 text-center border border-(--color-border)">
            <p className="text-xs text-(--color-text-muted) mb-1">Favourite Day</p>
            <p className="text-base font-bold text-(--color-text)">
              {mostActiveDayIndex !== null ? DOW_FULL[mostActiveDayIndex] : '—'}
            </p>
          </div>
          <div className="bg-(--color-bg) rounded-xl p-3 text-center border border-(--color-border)">
            <p className="text-xs text-(--color-text-muted) mb-1">Favourite Time</p>
            <p className="text-base font-bold text-(--color-text)">
              {mostActiveHour !== null ? hourLabel(mostActiveHour) : '—'}
            </p>
          </div>
        </div>

        {/* DOW heatmap */}
        {dowData.length === 7 && (
          <div>
            <p className="text-xs text-(--color-text-muted) mb-2">Day of Week</p>
            <div className="grid grid-cols-7 gap-1">
              {dowData.map((v, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg"
                  style={{ background: heatColor(v, dowMax) }}
                >
                  <span className="text-[9px] text-(--color-text)">{DOW_LABELS[i]}</span>
                  <span className="text-[10px] font-semibold text-(--color-text)">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOD heatmap */}
        {hodData.length === 24 && (
          <div>
            <p className="text-xs text-(--color-text-muted) mb-2">Time of Day</p>
            <div className="grid grid-cols-6 gap-1">
              {hodData.map((v, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-0.5 py-2 rounded"
                  style={{ background: heatColor(v, hodMax) }}
                  title={`${hourLabel(i)}: ${v} plays`}
                >
                  <span className="text-[8px] text-(--color-text) leading-tight">{hourLabel(i)}</span>
                  <span className="text-[9px] font-semibold text-(--color-text)">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

// ── Section: Streak ───────────────────────────────────────────────────────────

function StreakSection({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <SectionWrapper accent>
      <div className="px-6 py-8 text-center">
        <SectionLabel text="Longest Streak" />
        <div className="flex justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-(--color-accent)">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
          </svg>
        </div>
        <p className="text-6xl font-black text-(--color-text) tabular-nums leading-none mb-2">{streak}</p>
        <p className="text-sm text-(--color-text-muted)">consecutive {streak === 1 ? 'day' : 'days'} watching</p>
      </div>
    </SectionWrapper>
  );
}

// ── Section: First & Last ─────────────────────────────────────────────────────

function FirstLastCard({ item, label }: { item: WrappedMediaItem; label: string }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center text-center gap-2">
      <p className="text-xs text-(--color-text-muted) font-semibold uppercase tracking-widest">{label}</p>
      <PosterImg thumb={item.thumb} alt={item.title} className="w-24 aspect-2/3" />
      <p className="text-sm font-medium text-(--color-text) leading-tight line-clamp-2">{item.title}</p>
      <p className="text-xs text-(--color-text-muted)">{item.mediaType === 'show' ? 'TV' : 'Movie'}</p>
    </div>
  );
}

function FirstLastSection({ data }: { data: WrappedSummary }) {
  if (!data.firstWatched && !data.lastWatched) return null;
  return (
    <SectionWrapper>
      <div className="px-4 pt-5 pb-2 border-b border-(--color-border)">
        <SectionLabel text="First & Last" />
      </div>
      <div className="p-4 flex gap-6 justify-center">
        {data.firstWatched && <FirstLastCard item={data.firstWatched} label="First watched" />}
        {data.firstWatched && data.lastWatched && (
          <div className="w-px bg-(--color-border) self-stretch" />
        )}
        {data.lastWatched && <FirstLastCard item={data.lastWatched} label="Last watched" />}
      </div>
    </SectionWrapper>
  );
}

// ── Section: Platform Breakdown ───────────────────────────────────────────────

function PlatformsSection({ platforms }: { platforms: PlatformCount[] }) {
  if (platforms.length === 0) return null;
  const total = platforms.reduce((acc, p) => acc + p.plays, 0);
  return (
    <SectionWrapper>
      <div className="px-4 pt-5 pb-2 border-b border-(--color-border)">
        <SectionLabel text="How You Watched" />
      </div>
      <div className="p-4 space-y-3">
        {platforms.map(({ platform, plays }) => {
          const pct = total > 0 ? Math.round((plays / total) * 100) : 0;
          return (
            <div key={platform}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-(--color-text) font-medium">{platform}</span>
                <span className="text-xs text-(--color-text-muted) tabular-nums">{plays} plays ({pct}%)</span>
              </div>
              <div className="h-2 rounded-full bg-(--color-bg) overflow-hidden">
                <div
                  className="h-full rounded-full bg-(--color-accent) transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}

// ── Section: Monthly Journey ──────────────────────────────────────────────────

function MonthlySection({ monthlyPlays, year }: { monthlyPlays: number[]; year: number }) {
  const hasData = monthlyPlays.some((v) => v > 0);
  if (!hasData) return null;

  const chartData: MonthPoint[] = MONTH_LABELS.map((month, i) => ({
    month,
    plays: monthlyPlays[i] ?? 0,
  }));

  const peakMonth = monthlyPlays.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0);

  return (
    <SectionWrapper>
      <div className="px-4 pt-5 pb-2 border-b border-(--color-border)">
        <SectionLabel text="Monthly Journey" />
        <p className="text-xs text-(--color-text-muted)">
          Your busiest month in {year} was{' '}
          <span className="font-semibold text-(--color-text)">{MONTH_LABELS[peakMonth]}</span>
          {' '}with <span className="font-semibold text-(--color-text)">{(monthlyPlays[peakMonth] ?? 0).toLocaleString()} plays</span>
        </p>
      </div>
      <div className="p-4">
        <MonthlyBarChart data={chartData} />
      </div>
    </SectionWrapper>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  data: WrappedSummary | null;
  selectedYear: number;
  availableYears: number[];
  noTautulli?: boolean;
}

export default function WrappedClient({ data, selectedYear, availableYears, noTautulli }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onYearChange(y: number) {
    startTransition(() => {
      router.push(y === new Date().getFullYear() ? '/wrapped' : `/wrapped?year=${y}`);
    });
  }

  if (noTautulli) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-(--color-surface) border border-(--color-border) flex items-center justify-center mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-(--color-text-muted)">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-(--color-text) mb-2">Tautulli not enabled</h2>
        <p className="text-sm text-(--color-text-muted) max-w-sm leading-relaxed">
          Enable the Tautulli module in the admin panel to generate your Wrapped summary.
        </p>
      </div>
    );
  }

  return (
    <div className={isPending ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
      {/* Year selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-(--color-text)">Wrapped</h1>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Your annual media summary.</p>
        </div>
        {availableYears.length > 1 && (
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
            className="text-sm font-medium bg-(--color-surface) border border-(--color-border) text-(--color-text) rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-(--color-accent) cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {!data || data.totalPlays === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-(--color-surface) rounded-2xl border border-(--color-border)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-(--color-text-muted) mb-4">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
          <p className="text-base font-semibold text-(--color-text) mb-1">No data for {selectedYear}</p>
          <p className="text-sm text-(--color-text-muted)">
            {selectedYear < new Date().getFullYear()
              ? 'No watch history found for this year.'
              : `Start watching to build your ${selectedYear} Wrapped!`}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <HeroSection data={data} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TopMediaSection items={data.topShows} label="Top Shows" />
            <TopMediaSection items={data.topMovies} label="Top Movies" />
          </div>

          <PatternsSection data={data} />
          <StreakSection streak={data.streak} />
          <FirstLastSection data={data} />
          <PlatformsSection platforms={data.platforms} />
          <MonthlySection monthlyPlays={data.monthlyPlays} year={data.year} />
        </div>
      )}
    </div>
  );
}
