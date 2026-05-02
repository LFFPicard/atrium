import { db } from '@/lib/db';
import { statsCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSetting } from '@/lib/settings';
import { getModule } from '@/lib/modules';

const CACHE_TTL = 7 * 24 * 3600; // 7 days
const TMDB_API = 'https://api.themoviedb.org/3';

/**
 * Fetch the poster_path for a TMDB movie or TV show, with a 7-day cache in
 * stats_cache. Returns null if: no API key, TMDB not found, or fetch fails.
 * An empty-string cached value represents a known miss so we don't hammer TMDB.
 */
export async function getTmdbPosterPath(
  tmdbId: string,
  type: 'movie' | 'tv',
): Promise<string | null> {
  const apiKey = getSetting<string>('tmdb_api_key');
  if (!apiKey?.trim()) return null;

  const cacheKey = `tmdb:poster:${type}:${tmdbId}`;
  const now = Math.floor(Date.now() / 1000);

  const cached = db.select().from(statsCache).where(eq(statsCache.key, cacheKey)).get();
  if (cached && cached.expiresAt > now) {
    return cached.data || null; // '' = cached miss
  }

  try {
    const endpoint = type === 'movie' ? 'movie' : 'tv';
    const res = await fetch(`${TMDB_API}/${endpoint}/${tmdbId}?api_key=${apiKey}`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { poster_path?: string | null };
    const posterPath = data.poster_path ?? null;

    const expiresAt = now + CACHE_TTL;
    db.insert(statsCache)
      .values({ key: cacheKey, data: posterPath ?? '', expiresAt })
      .onConflictDoUpdate({
        target: statsCache.key,
        set: { data: posterPath ?? '', expiresAt },
      })
      .run();

    return posterPath;
  } catch {
    return null;
  }
}

/**
 * Resolve a Tautulli rating_key to a TMDB ID by calling get_metadata and parsing
 * the guids array (e.g. ["tmdb://12345", "tvdb://67890"]). For TV episodes pass the
 * grandparent_rating_key (the show) so we get the show-level TMDB ID.
 * Result is cached in stats_cache for 7 days; '' represents a confirmed miss.
 */
export async function getTmdbIdFromTautulli(
  ratingKey: string,
): Promise<string | null> {
  const cacheKey = `tmdb_id:${ratingKey}`;
  const now = Math.floor(Date.now() / 1000);

  const cached = db.select().from(statsCache).where(eq(statsCache.key, cacheKey)).get();
  if (cached && cached.expiresAt > now) {
    return cached.data || null;
  }

  try {
    const record = getModule('tautulli');
    const url = record.config['tautulli_url'] as string | undefined;
    const key = record.config['tautulli_api_key'] as string | undefined;
    if (!url || !key) return null;

    const base = url.replace(/\/+$/, '');
    const params = new URLSearchParams({ apikey: key, cmd: 'get_metadata', rating_key: ratingKey });
    const res = await fetch(`${base}/api/v2?${params}`, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      response?: { data?: { guids?: string[] } };
    };
    const guids = data?.response?.data?.guids ?? [];
    const tmdbEntry = guids.find((g) => g.startsWith('tmdb://'));
    const tmdbId = tmdbEntry ? tmdbEntry.replace('tmdb://', '') : null;

    const expiresAt = now + CACHE_TTL;
    db.insert(statsCache)
      .values({ key: cacheKey, data: tmdbId ?? '', expiresAt })
      .onConflictDoUpdate({
        target: statsCache.key,
        set: { data: tmdbId ?? '', expiresAt },
      })
      .run();

    return tmdbId;
  } catch {
    return null;
  }
}
