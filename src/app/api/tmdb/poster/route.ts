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
    // No TMDB API key configured, ID not found, or fetch failed — caller falls back to Tautulli proxy
    return new NextResponse(null, { status: 404 });
  }

  // TMDB image CDN is public — redirect the browser directly to it.
  // Cache-Control on the redirect so browsers don't re-hit this route on every page load.
  return NextResponse.redirect(`https://image.tmdb.org/t/p/${size}${posterPath}`, {
    status: 302,
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
