import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getAllTabs, createTab, reorderTabs } from '@/lib/tabs';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(getAllTabs());
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json() as {
    label?: string;
    url?: string;
    icon?: string;
    minRole?: 'admin' | 'user';
    openInIframe?: boolean;
    enabled?: boolean;
  };

  if (!body.label?.trim() || !body.url?.trim()) {
    return NextResponse.json({ error: 'label and url are required' }, { status: 400 });
  }

  const tab = createTab({
    label: body.label.trim(),
    url: body.url.trim(),
    icon: body.icon?.trim() ?? '',
    minRole: body.minRole,
    openInIframe: body.openInIframe,
    enabled: body.enabled,
  });

  return NextResponse.json(tab, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json() as { ids?: string[] };
  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  reorderTabs(body.ids);
  return NextResponse.json({ ok: true });
}
