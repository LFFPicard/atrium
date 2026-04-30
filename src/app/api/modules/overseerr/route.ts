import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getModule, isModuleEnabled } from '@/lib/modules';

const ALLOWED_FILTERS = new Set([
  'all', 'pending', 'approved', 'declined', 'available', 'processing', 'unavailable',
]);

const APPROVE_DECLINE_RE = /^request\/(\d+)\/(approve|decline)$/;

function base(url: string) {
  return url.replace(/\/+$/, '');
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isModuleEnabled('overseerr')) {
    return NextResponse.json({ error: 'Overseerr module is not enabled' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint || !['requests', 'status'].includes(endpoint)) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const record = getModule('overseerr');
  const overseerrBase = base(record.config['overseerr_url'] ?? '');
  const key = record.config['overseerr_api_key'] ?? '';

  if (!overseerrBase || !key) {
    return NextResponse.json({ error: 'Overseerr not configured' }, { status: 503 });
  }

  try {
    if (endpoint === 'status') {
      const res = await fetch(`${overseerrBase}/api/v1/status`, {
        headers: { 'X-Api-Key': key },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return NextResponse.json({ error: `Overseerr returned ${res.status}` }, { status: 502 });
      const data: unknown = await res.json();
      return NextResponse.json(data);
    }

    // endpoint === 'requests'
    const filter = searchParams.get('filter') ?? 'all';
    if (!ALLOWED_FILTERS.has(filter)) {
      return NextResponse.json({ error: 'Invalid filter' }, { status: 400 });
    }

    const take = Math.min(Math.max(parseInt(searchParams.get('take') ?? '20', 10), 1), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') ?? '0', 10), 0);

    const params = new URLSearchParams({ filter, take: String(take), skip: String(skip) });
    const res = await fetch(`${overseerrBase}/api/v1/request?${params}`, {
      headers: { 'X-Api-Key': key },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return NextResponse.json({ error: `Overseerr returned ${res.status}` }, { status: 502 });
    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!isModuleEnabled('overseerr')) {
    return NextResponse.json({ error: 'Overseerr module is not enabled' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint') ?? '';

  const match = APPROVE_DECLINE_RE.exec(endpoint);
  if (!match) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const [, id, action] = match;

  const record = getModule('overseerr');
  const overseerrBase = base(record.config['overseerr_url'] ?? '');
  const key = record.config['overseerr_api_key'] ?? '';

  if (!overseerrBase || !key) {
    return NextResponse.json({ error: 'Overseerr not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(`${overseerrBase}/api/v1/request/${id}/${action}`, {
      method: 'POST',
      headers: { 'X-Api-Key': key },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return NextResponse.json({ error: `Overseerr returned ${res.status}` }, { status: 502 });
    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}
