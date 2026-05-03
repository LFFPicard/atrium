'use client';

import { useState, useEffect, useCallback } from 'react';

interface MediaDetails {
  tmdbId: string;
  type: 'movie' | 'tv';
  title: string;
  overview: string;
  posterPath: string | null;
  genres: string[];
  cast: { name: string; character: string }[];
  year?: string;
  voteAverage?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  tvdbId?: number;
}

interface Props {
  ratingKey: string;
  type: 'movie' | 'tv';
  onClose: () => void;
}

export default function MediaDetailModal({ ratingKey, type, onClose }: Props) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const idRes = await fetch(`/api/tmdb/id?rating_key=${encodeURIComponent(ratingKey)}`);
        const { tmdbId } = (await idRes.json()) as { tmdbId: string | null };
        if (cancelled) return;
        if (!tmdbId) { setNoData(true); setLoading(false); return; }

        const detailsRes = await fetch(`/api/tmdb/details?id=${encodeURIComponent(tmdbId)}&type=${type}`);
        if (cancelled) return;
        if (!detailsRes.ok) { setNoData(true); setLoading(false); return; }

        const d = (await detailsRes.json()) as MediaDetails;
        if (!cancelled) { setDetails(d); setLoading(false); }
      } catch {
        if (!cancelled) { setNoData(true); setLoading(false); }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [ratingKey, type]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-(--color-bg)/80 flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) transition-colors"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-56">
            <div className="w-7 h-7 rounded-full border-2 border-(--color-accent) border-t-transparent animate-spin" />
          </div>
        ) : noData || !details ? (
          <div className="flex flex-col items-center justify-center h-56 gap-2 text-(--color-text-muted)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-sm">No details available</p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            {/* Header */}
            <div className="flex gap-4 p-5 pr-10">
              {details.posterPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/tmdb/poster?id=${details.tmdbId}&type=${details.type}&size=w342`}
                  alt={details.title}
                  className="w-24 aspect-2/3 object-cover rounded-lg shrink-0 border border-(--color-border)"
                />
              ) : (
                <div className="w-24 aspect-2/3 bg-(--color-bg) rounded-lg shrink-0 border border-(--color-border) flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-(--color-border)">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <path d="M7 2v20M17 2v20M2 12h20" />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="text-base font-bold text-(--color-text) leading-snug">{details.title}</h2>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {details.year && (
                    <span className="text-xs text-(--color-text-muted)">{details.year}</span>
                  )}
                  {details.type === 'tv' && details.numberOfSeasons != null && (
                    <span className="text-xs text-(--color-text-muted)">
                      {details.numberOfSeasons} season{details.numberOfSeasons !== 1 ? 's' : ''}
                    </span>
                  )}
                  {details.type === 'tv' && details.numberOfEpisodes != null && (
                    <span className="text-xs text-(--color-text-muted)">{details.numberOfEpisodes} eps</span>
                  )}
                  {!!details.voteAverage && details.voteAverage > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-(--color-accent)/15 text-(--color-accent) font-medium">
                      ★ {details.voteAverage.toFixed(1)}
                    </span>
                  )}
                </div>

                {details.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {details.genres.slice(0, 4).map((g) => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-(--color-bg) border border-(--color-border) text-(--color-text-muted)">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3 flex-wrap">
                  <a
                    href={`https://www.themoviedb.org/${details.type}/${details.tmdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 rounded bg-(--color-accent)/15 text-(--color-accent) font-medium hover:bg-(--color-accent)/25 transition-colors"
                  >
                    TMDB ↗
                  </a>
                  {details.type === 'tv' && details.tvdbId && (
                    <a
                      href={`https://www.thetvdb.com/?tab=series&id=${details.tvdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded bg-(--color-bg) border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) transition-colors"
                    >
                      TVDB ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Overview */}
            {details.overview && (
              <div className="px-5 pb-4 border-t border-(--color-border) pt-4">
                <p className="text-xs text-(--color-text-muted) leading-relaxed">{details.overview}</p>
              </div>
            )}

            {/* Cast */}
            {details.cast.length > 0 && (
              <div className="px-5 pb-5 border-t border-(--color-border) pt-4">
                <p className="text-[10px] font-semibold text-(--color-text-muted) uppercase tracking-widest mb-2">Cast</p>
                <div className="space-y-1.5">
                  {details.cast.map((c, i) => (
                    <div key={i} className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-xs font-medium text-(--color-text) shrink-0">{c.name}</span>
                      {c.character && (
                        <>
                          <span className="text-(--color-border) text-xs shrink-0">·</span>
                          <span className="text-xs text-(--color-text-muted) truncate">{c.character}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
