'use client';

import { useState, useEffect } from 'react';

interface RecentItem {
  title: string;
  year: number;
  added_at: number;
  media_type: string;
  grandparent_title: string;
  parent_title: string;
  thumb: string;
  grandparent_thumb: string;
  // TMDB IDs — present in newer Tautulli versions
  tmdb_id?: number | null;
  guid?: string;              // e.g. "tmdb://12345" for movies
  grandparent_guid?: string;  // e.g. "tmdb://67890" for TV shows
}

interface RecentlyAddedResponse {
  response?: {
    result?: string;
    data?: { recently_added?: RecentItem[] };
  };
  error?: string;
}

function timeAgo(ts: number): string {
  const secs = Math.floor(Date.now() / 1000) - ts;
  if (secs < 3600) return `${Math.max(1, Math.floor(secs / 60))}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function parseTmdbId(guid?: string): string | null {
  if (!guid) return null;
  const m = guid.match(/^tmdb:\/\/(\d+)/);
  return m ? m[1] : null;
}

function tautulliImage(path: string, width?: number, height?: number): string {
  const base = `/api/modules/tautulli?cmd=get_image&img=${encodeURIComponent(path)}`;
  if (width && height) return `${base}&width=${width}&height=${height}`;
  return base;
}

function FilmPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-(--color-border)">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    </div>
  );
}

function PosterCard({ item }: { item: RecentItem }) {
  const isTV = item.media_type === 'episode';
  const label = isTV ? item.grandparent_title : item.title;
  // TV episodes: grandparent_thumb is the show poster; movies: thumb is the movie poster
  const thumb = isTV ? item.grandparent_thumb : item.thumb;

  const tmdbId = isTV
    ? parseTmdbId(item.grandparent_guid)
    : (item.tmdb_id ? String(item.tmdb_id) : parseTmdbId(item.guid));
  const tautulliSrc = thumb ? tautulliImage(thumb, 150, 225) : null;
  const initialSrc = tmdbId
    ? `/api/tmdb/poster?id=${tmdbId}&type=${isTV ? 'tv' : 'movie'}&size=w200`
    : tautulliSrc;

  const [src, setSrc] = useState<string | null>(initialSrc);

  function handleError() {
    if (tautulliSrc && src !== tautulliSrc) setSrc(tautulliSrc);
    else setSrc(null);
  }

  return (
    <div className="group">
      <div className="aspect-2/3 bg-(--color-bg) rounded-lg overflow-hidden border border-(--color-border)">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleError}
          />
        ) : (
          <FilmPlaceholder />
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium text-(--color-text) truncate leading-tight">{label}</p>
      <p className="text-xs text-(--color-text-muted)">{timeAgo(item.added_at)}</p>
    </div>
  );
}

export default function RecentlyAddedWidget() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules/tautulli?cmd=get_recently_added&count=10')
      .then((r) => r.json())
      .then((d: RecentlyAddedResponse) => {
        setItems(d?.response?.data?.recently_added ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
        <p className="text-sm font-semibold text-(--color-text)">Recently Added</p>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-2/3 bg-(--color-bg) rounded-lg animate-pulse border border-(--color-border)" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-(--color-text-muted)">Nothing recently added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {items.map((item, i) => (
              <PosterCard key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
