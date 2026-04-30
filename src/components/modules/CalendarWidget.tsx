'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SonarrEpisode {
  id: number;
  seriesId: number;
  episodeNumber: number;
  seasonNumber: number;
  airDate: string;
  series: {
    id: number;
    title: string;
    images: Array<{ coverType: string; url: string; remoteUrl?: string }>;
  };
}

interface RadarrMovie {
  id: number;
  title: string;
  inCinemas?: string;
  digitalRelease?: string;
  physicalRelease?: string;
  images: Array<{ coverType: string; url: string; remoteUrl?: string }>;
}

interface CalendarItem {
  key: string;
  type: 'show' | 'movie';
  mediaId: number;
  date: string;
  title: string;
  subtitle?: string;
  posterUrl?: string;
}

interface Sub {
  mediaType: 'show' | 'movie';
  sonarrId?: number | null;
  radarrId?: number | null;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(base: string, n: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatRelDate(dateStr: string, today: string): string {
  if (dateStr === today) return 'Today';
  const tomorrow = addDays(today, 1);
  if (dateStr === tomorrow) return 'Tomorrow';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function posterFor(images: Array<{ coverType: string; url: string; remoteUrl?: string }>, proxyBase: string): string | undefined {
  const img = images.find((i) => i.coverType === 'poster');
  if (!img) return undefined;
  if (img.remoteUrl) return img.remoteUrl;
  return `${proxyBase}?endpoint=image&url=${encodeURIComponent(img.url)}`;
}

export default function CalendarWidget() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const today = todayStr();
    const end = addDays(today, 7);

    let subs: Sub[] = [];
    try {
      const res = await fetch('/api/subscriptions');
      if (res.ok) subs = (await res.json()) as Sub[];
    } catch { /* skip */ }

    if (subs.length === 0) {
      setLoading(false);
      return;
    }

    const showIds = new Set(subs.filter((s) => s.mediaType === 'show' && s.sonarrId).map((s) => s.sonarrId!));
    const movieIds = new Set(subs.filter((s) => s.mediaType === 'movie' && s.radarrId).map((s) => s.radarrId!));

    const all: CalendarItem[] = [];

    if (showIds.size > 0) {
      try {
        const res = await fetch(`/api/modules/sonarr?endpoint=calendar&start=${today}&end=${end}`);
        if (res.ok) {
          const eps = (await res.json()) as SonarrEpisode[];
          for (const ep of eps) {
            if (!ep.airDate || !showIds.has(ep.seriesId)) continue;
            all.push({
              key: `sonarr-ep-${ep.id}`,
              type: 'show',
              mediaId: ep.seriesId,
              date: ep.airDate,
              title: ep.series.title,
              subtitle: `S${String(ep.seasonNumber).padStart(2, '0')}E${String(ep.episodeNumber).padStart(2, '0')}`,
              posterUrl: posterFor(ep.series.images, '/api/modules/sonarr'),
            });
          }
        }
      } catch { /* skip */ }
    }

    if (movieIds.size > 0) {
      try {
        const res = await fetch(`/api/modules/radarr?endpoint=calendar&start=${today}&end=${end}`);
        if (res.ok) {
          const movies = (await res.json()) as RadarrMovie[];
          for (const m of movies) {
            if (!movieIds.has(m.id)) continue;
            const date = (m.digitalRelease ?? m.physicalRelease ?? m.inCinemas)?.split('T')[0];
            if (!date) continue;
            all.push({
              key: `radarr-${m.id}`,
              type: 'movie',
              mediaId: m.id,
              date,
              title: m.title,
              posterUrl: posterFor(m.images, '/api/modules/radarr'),
            });
          }
        }
      } catch { /* skip */ }
    }

    all.sort((a, b) => a.date.localeCompare(b.date));
    setItems(all.slice(0, 5));
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
          <div className="w-4 h-4 rounded bg-(--color-border) animate-pulse" />
          <div className="w-24 h-4 rounded bg-(--color-border) animate-pulse" />
        </div>
        <div className="flex gap-3 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-20 shrink-0 animate-pulse">
              <div className="aspect-2/3 bg-(--color-border) rounded-lg" />
              <div className="h-3 w-full bg-(--color-border) rounded mt-1.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const today = todayStr();

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <p className="text-sm font-semibold text-(--color-text)">Coming Up</p>
        </div>
        <Link href="/calendar" className="text-xs text-(--color-accent) hover:underline font-medium">
          View all
        </Link>
      </div>

      <div className="flex gap-3 p-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <Link key={item.key} href="/calendar" className="w-20 shrink-0 group">
            <div className="aspect-2/3 rounded-lg overflow-hidden bg-(--color-bg) border border-(--color-border) mb-1.5">
              {item.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-(--color-text-muted)">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-[11px] font-medium text-(--color-text) truncate leading-tight" title={item.title}>
              {item.title}
            </p>
            {item.subtitle && (
              <p className="text-[10px] text-(--color-text-muted) leading-tight">{item.subtitle}</p>
            )}
            <p className="text-[10px] text-(--color-accent) font-medium mt-0.5">
              {formatRelDate(item.date, today)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
