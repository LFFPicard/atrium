import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { isModuleEnabled } from '@/lib/modules';
import { getTmdbIdFromTautulli } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isModuleEnabled('tautulli')) {
    return NextResponse.json({ tmdbId: null });
  }

  const { searchParams } = new URL(req.url);
  const ratingKey = searchParams.get('rating_key');

  if (!ratingKey) {
    return NextResponse.json({ error: 'Missing rating_key' }, { status: 400 });
  }

  const tmdbId = await getTmdbIdFromTautulli(ratingKey);
  return NextResponse.json({ tmdbId });
}
