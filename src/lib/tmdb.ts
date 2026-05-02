import { db } from '@/lib/db';
import { statsCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSetting } from '@/lib/settings';

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
