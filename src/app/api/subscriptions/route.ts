import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getUserSubscriptions, addSubscription, removeSubscription } from '@/lib/subscriptions';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subs = getUserSubscriptions(userId);
  return NextResponse.json(subs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    mediaType?: unknown;
    sonarrId?: unknown;
    radarrId?: unknown;
    title?: unknown;
    posterUrl?: unknown;
    notifyEmail?: unknown;
  };

  const { mediaType, sonarrId, radarrId, title } = body;

  if (mediaType !== 'show' && mediaType !== 'movie') {
    return NextResponse.json({ error: 'Invalid mediaType' }, { status: 400 });
  }
  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Missing title' }, { status: 400 });
  }
  if (mediaType === 'show' && typeof sonarrId !== 'number') {
    return NextResponse.json({ error: 'Missing sonarrId' }, { status: 400 });
  }
  if (mediaType === 'movie' && typeof radarrId !== 'number') {
    return NextResponse.json({ error: 'Missing radarrId' }, { status: 400 });
  }

  const sub = addSubscription(userId, {
    mediaType,
    sonarrId: typeof sonarrId === 'number' ? sonarrId : null,
    radarrId: typeof radarrId === 'number' ? radarrId : null,
    title,
    posterUrl: typeof body.posterUrl === 'string' ? body.posterUrl : null,
    notifyEmail: body.notifyEmail === true,
  });

  return NextResponse.json(sub, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mediaType = searchParams.get('mediaType');
  const mediaIdStr = searchParams.get('mediaId');

  if (mediaType !== 'show' && mediaType !== 'movie') {
    return NextResponse.json({ error: 'Invalid mediaType' }, { status: 400 });
  }
  const mediaId = Number(mediaIdStr);
  if (!mediaIdStr || isNaN(mediaId)) {
    return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
  }

  removeSubscription(userId, mediaId, mediaType);
  return new NextResponse(null, { status: 204 });
}
