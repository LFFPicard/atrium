import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getTmdbPosterPath } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const rawType = searchParams.get('type');
  const size = searchParams.get('size') ?? 'w200';

  if (!id || (rawType !== 'movie' && rawType !== 'tv')) {
    return NextResponse.json({ error: 'Missing or invalid id/type' }, { status: 400 });
  }

  const posterPath = await getTmdbPosterPath(id, rawType);
  if (!posterPath) {
    return new NextResponse(null, { status: 404 });
  }

  const tmdbUrl = `https://image.tmdb.org/t/p/${size}${posterPath}`;
  console.log('[atrium/tmdb/poster] fetching:', tmdbUrl);

  const imageRes = await fetch(tmdbUrl, { signal: AbortSignal.timeout(8_000) });
  if (!imageRes.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const buffer = await imageRes.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': imageRes.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=604800',
    },
  });
}
