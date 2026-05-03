import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getSetting } from '@/lib/settings';
import { db } from '@/lib/db';
import { statsCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const TMDB_API = 'https://api.themoviedb.org/3';
const CACHE_TTL = 7 * 24 * 3600;

interface RawGenre { name: string }
interface RawCastMember { name: string; character: string; order: number }

interface TmdbMovieResp {
  title?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
  genres?: RawGenre[];
  credits?: { cast?: RawCastMember[] };
}

interface TmdbTvResp {
  name?: string;
  overview?: string;
  poster_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: RawGenre[];
  credits?: { cast?: RawCastMember[] };
  external_ids?: { tvdb_id?: number };
}

export interface MediaDetails {
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const rawType = searchParams.get('type');

  if (!id || (rawType !== 'movie' && rawType !== 'tv')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const apiKey = getSetting<string>('tmdb_api_key');
  if (!apiKey?.trim()) return NextResponse.json({ error: 'No TMDB API key configured' }, { status: 503 });

  const cacheKey = `tmdb:details:${rawType}:${id}`;
  const now = Math.floor(Date.now() / 1000);

  const cached = db.select().from(statsCache).where(eq(statsCache.key, cacheKey)).get();
  if (cached && cached.expiresAt > now) {
    try {
      return NextResponse.json(JSON.parse(cached.data) as MediaDetails);
    } catch { /* fall through and re-fetch */ }
  }

  try {
    const res = await fetch(
      `${TMDB_API}/${rawType}/${id}?api_key=${apiKey}&append_to_response=credits,external_ids`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const expiresAt = now + CACHE_TTL;

    if (rawType === 'movie') {
      const raw = (await res.json()) as TmdbMovieResp;
      const details: MediaDetails = {
        tmdbId: id,
        type: 'movie',
        title: raw.title ?? 'Unknown',
        overview: raw.overview ?? '',
        posterPath: raw.poster_path ?? null,
        genres: (raw.genres ?? []).map((g) => g.name),
        cast: (raw.credits?.cast ?? []).slice(0, 6).map((c) => ({ name: c.name, character: c.character })),
        year: raw.release_date?.slice(0, 4),
        voteAverage: raw.vote_average,
      };
      db.insert(statsCache)
        .values({ key: cacheKey, data: JSON.stringify(details), expiresAt })
        .onConflictDoUpdate({ target: statsCache.key, set: { data: JSON.stringify(details), expiresAt } })
        .run();
      return NextResponse.json(details);
    }

    const raw = (await res.json()) as TmdbTvResp;
    const details: MediaDetails = {
      tmdbId: id,
      type: 'tv',
      title: raw.name ?? 'Unknown',
      overview: raw.overview ?? '',
      posterPath: raw.poster_path ?? null,
      genres: (raw.genres ?? []).map((g) => g.name),
      cast: (raw.credits?.cast ?? []).slice(0, 6).map((c) => ({ name: c.name, character: c.character })),
      year: raw.first_air_date?.slice(0, 4),
      voteAverage: raw.vote_average,
      numberOfSeasons: raw.number_of_seasons,
      numberOfEpisodes: raw.number_of_episodes,
      tvdbId: raw.external_ids?.tvdb_id,
    };
    db.insert(statsCache)
      .values({ key: cacheKey, data: JSON.stringify(details), expiresAt })
      .onConflictDoUpdate({ target: statsCache.key, set: { data: JSON.stringify(details), expiresAt } })
      .run();
    return NextResponse.json(details);
  } catch {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}
