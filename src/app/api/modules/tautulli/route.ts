import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getModule, isModuleEnabled } from '@/lib/modules';

const ALLOWED_CMDS = new Set([
  'get_activity',
  'get_recently_added',
  'get_image',
  'get_user_stats',
  'get_plays_by_date',
  'get_plays_by_dayofweek',
  'get_plays_by_hourofday',
  'get_home_stats',
]);

const STAT_CMDS = new Set([
  'get_user_stats',
  'get_plays_by_date',
  'get_plays_by_dayofweek',
  'get_plays_by_hourofday',
  'get_home_stats',
]);

const STAT_PASSTHROUGH = ['time_range', 'y_axis', 'user_id', 'stats_count', 'stat_id', 'section_id'];

function base(url: string): string {
  return url.replace(/\/+$/, '');
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isModuleEnabled('tautulli')) {
    return NextResponse.json({ error: 'Tautulli module is not enabled' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const cmd = searchParams.get('cmd');

  if (!cmd || !ALLOWED_CMDS.has(cmd)) {
    return NextResponse.json({ error: 'Invalid or missing cmd parameter' }, { status: 400 });
  }

  const record = getModule('tautulli');
  const url = record.config['tautulli_url'];
  const key = record.config['tautulli_api_key'];

  if (!url || !key) {
    return NextResponse.json({ error: 'Tautulli not configured' }, { status: 503 });
  }

  const tautulliBase = base(url);

  try {
    if (cmd === 'get_image') {
      const img = searchParams.get('img');
      if (!img) return NextResponse.json({ error: 'Missing img parameter' }, { status: 400 });

      const params = new URLSearchParams({ img, apikey: key, fallback: 'poster' });
      const w = searchParams.get('width');
      const h = searchParams.get('height');
      if (w) params.set('width', w);
      if (h) params.set('height', h);

      const res = await fetch(`${tautulliBase}/pms_image_proxy?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return new NextResponse(null, { status: res.status });

      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const params = new URLSearchParams({ apikey: key, cmd });

    if (cmd === 'get_recently_added') {
      params.set('count', searchParams.get('count') ?? '10');
    }

    if (STAT_CMDS.has(cmd)) {
      for (const p of STAT_PASSTHROUGH) {
        const v = searchParams.get(p);
        if (v) params.set(p, v);
      }
    }

    const timeout = STAT_CMDS.has(cmd) ? 20_000 : 8_000;
    const res = await fetch(`${tautulliBase}/api/v2?${params}`, {
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Tautulli returned ${res.status}` }, { status: 502 });
    }

    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}
