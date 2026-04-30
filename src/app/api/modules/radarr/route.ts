import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getModule, isModuleEnabled } from '@/lib/modules';

const ALLOWED = new Set(['calendar', 'movie', 'image']);

function base(url: string) {
  return url.replace(/\/+$/, '');
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isModuleEnabled('radarr')) {
    return NextResponse.json({ error: 'Radarr module is not enabled' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint || !ALLOWED.has(endpoint)) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const record = getModule('radarr');
  const radarrBase = base(record.config['radarr_url'] ?? '');
  const key = record.config['radarr_api_key'] ?? '';

  if (!radarrBase || !key) {
    return NextResponse.json({ error: 'Radarr not configured' }, { status: 503 });
  }

  try {
    if (endpoint === 'image') {
      const imgPath = searchParams.get('url');
      if (!imgPath) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
      const res = await fetch(`${radarrBase}${imgPath}?apikey=${key}`, {
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

    const params = new URLSearchParams({ apikey: key });
    if (endpoint === 'calendar') {
      const start = searchParams.get('start');
      const end = searchParams.get('end');
      if (start) params.set('start', start);
      if (end) params.set('end', end);
    }

    const res = await fetch(`${radarrBase}/api/v3/${endpoint}?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Radarr returned ${res.status}` }, { status: 502 });
    }
    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}
