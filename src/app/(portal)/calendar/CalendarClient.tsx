'use client';

import { useState, useEffect, useRef } from 'react';

interface SonarrEpisode {
  id: number;
  seriesId: number;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
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

interface InitialSub {
  mediaType: 'show' | 'movie';
  sonarrId?: number | null;
  radarrId?: number | null;
  title: string;
  posterUrl?: string | null;
}

interface Props {
  initialSubscriptions: InitialSub[];
  sonarrEnabled: boolean;
  radarrEnabled: boolean;
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

function buildDayRange(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

function formatDayHeader(dateStr: string): { weekday: string; dayMonth: string } {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    dayMonth: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  };
}

function posterFor(images: Array<{ coverType: string; url: string; remoteUrl?: string }>, proxyBase: string): string | undefined {
  const img = images.find((i) => i.coverType === 'poster');
  if (!img) return undefined;
  if (img.remoteUrl) return img.remoteUrl;
  return `${proxyBase}?endpoint=image&url=${encodeURIComponent(img.url)}`;
}

function FilmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-(--color-text-muted)">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 ${filled ? 'text-red-500' : 'text-white'}`}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export default function CalendarClient({ initialSubscriptions, sonarrEnabled, radarrEnabled }: Props) {
  const today = todayStr();
  const days = buildDayRange(today, 30);

  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [subscribedKeys, setSubscribedKeys] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const sub of initialSubscriptions) {
      if (sub.mediaType === 'show' && sub.sonarrId) s.add(`show-${sub.sonarrId}`);
      if (sub.mediaType === 'movie' && sub.radarrId) s.add(`movie-${sub.radarrId}`);
    }
    return s;
  });
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadCalendar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCalendar() {
    const start = days[0];
    const end = days[days.length - 1];
    const all: CalendarItem[] = [];

    if (sonarrEnabled) {
      try {
        const res = await fetch(`/api/modules/sonarr?endpoint=calendar&start=${start}&end=${end}`);
        if (res.ok) {
          const eps = (await res.json()) as SonarrEpisode[];
          for (const ep of eps) {
            if (!ep.airDate) continue;
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
      } catch { /* network errors: skip */ }
    }

    if (radarrEnabled) {
      try {
        const res = await fetch(`/api/modules/radarr?endpoint=calendar&start=${start}&end=${end}`);
        if (res.ok) {
          const movies = (await res.json()) as RadarrMovie[];
          for (const m of movies) {
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
      } catch { /* network errors: skip */ }
    }

    setItems(all);
    setLoading(false);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); el.scrollBy({ left: 150, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); el.scrollBy({ left: -150, behavior: 'smooth' }); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  async function toggleSubscribe(item: CalendarItem) {
    const key = `${item.type}-${item.mediaId}`;
    const alreadySubscribed = subscribedKeys.has(key);

    setSubscribedKeys((prev) => {
      const next = new Set(prev);
      if (alreadySubscribed) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      if (alreadySubscribed) {
        await fetch(
          `/api/subscriptions?mediaType=${item.type === 'show' ? 'show' : 'movie'}&mediaId=${item.mediaId}`,
          { method: 'DELETE' },
        );
      } else {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaType: item.type === 'show' ? 'show' : 'movie',
            sonarrId: item.type === 'show' ? item.mediaId : undefined,
            radarrId: item.type === 'movie' ? item.mediaId : undefined,
            title: item.title,
            posterUrl: item.posterUrl,
          }),
        });
      }
    } catch {
      // Revert optimistic update
      setSubscribedKeys((prev) => {
        const next = new Set(prev);
        if (alreadySubscribed) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  }

  const byDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    if (!byDate.has(item.date)) byDate.set(item.date, []);
    byDate.get(item.date)!.push(item);
  }

  const totalItems = items.filter(
    (i) => filter === 'all' || subscribedKeys.has(`${i.type}-${i.mediaId}`),
  ).length;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <p className="text-sm font-semibold text-(--color-text)">Upcoming</p>
          {!loading && (
            <span className="text-xs text-(--color-text-muted)">
              {totalItems === 0 ? 'nothing in the next 30 days' : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-(--color-border) text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 transition-colors ${filter === 'all' ? 'bg-(--color-accent) text-(--color-accent-text)' : 'text-(--color-text-muted) hover:text-(--color-text)'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1.5 transition-colors border-l border-(--color-border) ${filter === 'mine' ? 'bg-(--color-accent) text-(--color-accent-text)' : 'text-(--color-text-muted) hover:text-(--color-text)'}`}
          >
            My Shows
          </button>
        </div>
      </div>

      {/* Scrollable rolodex */}
      {loading ? (
        <div className="flex items-center gap-3 p-4 overflow-x-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-32.5 shrink-0 animate-pulse">
              <div className="h-4 w-16 bg-(--color-border) rounded mb-2 mx-auto" />
              <div className="aspect-2/3 bg-(--color-border) rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          tabIndex={0}
          className="flex overflow-x-auto gap-2 p-3 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) scroll-smooth"
          style={{ scrollbarWidth: 'thin' }}
        >
          {days.map((day) => {
            const dayItems = (byDate.get(day) ?? []).filter(
              (i) => filter === 'all' || subscribedKeys.has(`${i.type}-${i.mediaId}`),
            );
            const isToday = day === today;
            const { weekday, dayMonth } = formatDayHeader(day);

            if (dayItems.length === 0) {

              return (
                <div key={day} className="w-7 shrink-0 flex flex-col items-center">
                  <div className={`w-full rounded py-1 text-center ${isToday ? 'bg-(--color-accent)' : ''}`}>
                    <span
                      className={`text-[10px] font-medium block [writing-mode:vertical-rl] rotate-180 mx-auto leading-none ${isToday ? 'text-(--color-accent-text)' : 'text-(--color-text-muted)'}`}
                      style={{ height: '3rem' }}
                    >
                      {dayMonth}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={day} className="w-32.5 shrink-0">
                <div className={`rounded-t-lg px-2 py-1.5 mb-1.5 text-center ${isToday ? 'bg-(--color-accent)' : 'bg-(--color-bg)'}`}>
                  <p className={`text-[10px] font-medium ${isToday ? 'text-(--color-accent-text)' : 'text-(--color-text-muted)'}`}>
                    {weekday}
                  </p>
                  <p className={`text-xs font-semibold ${isToday ? 'text-(--color-accent-text)' : 'text-(--color-text)'}`}>
                    {dayMonth}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {dayItems.map((item) => {
                    const isSubscribed = subscribedKeys.has(`${item.type}-${item.mediaId}`);
                    return (
                      <div key={item.key} className="relative group">
                        <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-(--color-bg) border border-(--color-border)">
                          {item.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.posterUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FilmIcon />
                            </div>
                          )}
                          <button
                            onClick={() => void toggleSubscribe(item)}
                            title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center transition-opacity ${isSubscribed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <HeartIcon filled={isSubscribed} />
                          </button>
                        </div>
                        <p className="text-[11px] font-medium text-(--color-text) mt-1 truncate leading-tight" title={item.title}>
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-[10px] text-(--color-text-muted) leading-tight">{item.subtitle}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {totalItems === 0 && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
              <p className="text-sm font-medium text-(--color-text) mb-1">
                {filter === 'mine' ? 'No subscribed titles this month' : 'Nothing scheduled in the next 30 days'}
              </p>
              {filter === 'mine' && (
                <p className="text-xs text-(--color-text-muted)">
                  Switch to All and click the heart on a show or movie to subscribe.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
