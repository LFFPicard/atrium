'use client';

import { useState, useEffect } from 'react';

interface TautulliSession {
  session_id: string;
  user: string;
  friendly_name: string;
  title: string;
  grandparent_title: string;
  parent_title: string;
  year: number;
  media_type: string;
  thumb: string;
  grandparent_thumb: string;
  rating_key: string;
  grandparent_rating_key: string;
  progress_percent: string;
  duration: number;
  view_offset: number;
  stream_video_resolution: string;
  stream_video_codec: string;
  transcode_decision: string;
  state: string;
  player: string;
}

interface ActivityResponse {
  response?: {
    result?: string;
    data?: {
      stream_count?: string;
      sessions?: TautulliSession[];
    };
  };
  error?: string;
}

function tautulliImage(path: string, width?: number, height?: number): string {
  const base = `/api/modules/tautulli?cmd=get_image&img=${encodeURIComponent(path)}`;
  if (width && height) return `${base}&width=${width}&height=${height}`;
  return base;
}

function transcodeLabel(decision: string): string {
  if (decision === 'direct play') return 'Direct Play';
  if (decision === 'transcode') return 'Transcoding';
  if (decision === 'copy') return 'Direct Stream';
  return decision;
}

function SessionPoster({ s }: { s: TautulliSession }) {
  const isTV = s.media_type === 'episode';
  const thumb = isTV ? s.grandparent_thumb : s.thumb;
  const tautulliSrc = thumb ? tautulliImage(thumb, 64, 96) : null;

  const [src, setSrc] = useState<string | null>(tautulliSrc);

  useEffect(() => {
    const ratingKey = isTV ? s.grandparent_rating_key : s.rating_key;
    const type = isTV ? 'tv' : 'movie';
    if (!ratingKey) return;

    fetch(`/api/tmdb/id?rating_key=${encodeURIComponent(ratingKey)}`)
      .then((r) => r.json())
      .then((d: { tmdbId: string | null }) => {
        if (d.tmdbId) setSrc(`/api/tmdb/poster?id=${d.tmdbId}&type=${type}`);
      })
      .catch(() => {});
  }, [s.rating_key, s.grandparent_rating_key, isTV]);

  function handleError() {
    if (tautulliSrc && src !== tautulliSrc) setSrc(tautulliSrc);
    else setSrc(null);
  }

  if (!src) {
    return (
      <div className="relative shrink-0 w-10 h-15 rounded overflow-hidden bg-(--color-border)" />
    );
  }

  return (
    <div className="relative shrink-0 w-10 h-15 rounded overflow-hidden bg-(--color-border)">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-full object-cover" onError={handleError} />
    </div>
  );
}

function SessionCard({ s }: { s: TautulliSession }) {
  const isTV = s.media_type === 'episode';
  const title = isTV ? s.grandparent_title : s.title;
  const subtitle = isTV ? `${s.parent_title} — ${s.title}` : String(s.year || '');
  const progress = Math.min(100, Math.max(0, parseInt(s.progress_percent, 10) || 0));
  const resolution = s.stream_video_resolution ? `${s.stream_video_resolution}p` : '';
  const tLabel = transcodeLabel(s.transcode_decision ?? '');
  const qualityBadge = [resolution, tLabel].filter(Boolean).join(' · ');
  const paused = s.state === 'paused';
  const displayName = s.friendly_name || s.user;

  return (
    <div className="flex items-start gap-3 p-3 bg-(--color-bg) rounded-lg">
      <SessionPoster s={s} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-(--color-text) truncate">{title}</p>
        {subtitle && <p className="text-xs text-(--color-text-muted) truncate">{subtitle}</p>}
        <div className="mt-2 h-1 bg-(--color-border) rounded-full overflow-hidden">
          <div
            className="h-full bg-(--color-accent) rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs text-(--color-text-muted)">
            {paused ? '⏸' : '▶'} {displayName}
          </span>
          {qualityBadge && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-(--color-surface) border border-(--color-border) text-(--color-text-muted)">
              {qualityBadge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 bg-(--color-bg) rounded-lg animate-pulse">
      <div className="w-10 h-15 bg-(--color-border) rounded shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-(--color-border) rounded w-3/4" />
        <div className="h-2 bg-(--color-border) rounded w-1/2" />
        <div className="h-1 bg-(--color-border) rounded mt-3" />
      </div>
    </div>
  );
}

export default function NowPlayingWidget() {
  const [sessions, setSessions] = useState<TautulliSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules/tautulli?cmd=get_activity')
      .then((r) => r.json())
      .then((d: ActivityResponse) => {
        setSessions(d?.response?.data?.sessions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <p className="text-sm font-semibold text-(--color-text)">Now Playing</p>
        {!loading && sessions.length > 0 && (
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-(--color-accent)/15 text-(--color-accent) font-medium">
            {sessions.length} stream{sessions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="p-3">
        {loading ? (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mx-auto mb-2 text-(--color-border)">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <p className="text-sm text-(--color-text-muted)">Nothing playing right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sessions.map((s) => (
              <SessionCard key={s.session_id} s={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
