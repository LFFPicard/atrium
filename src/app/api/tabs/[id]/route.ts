import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { updateTab, deleteTab } from '@/lib/tabs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tabs } from '@/lib/db/schema';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = db.select().from(tabs).where(eq(tabs.id, id)).get();
  if (!existing) return NextResponse.json({ error: 'Tab not found' }, { status: 404 });

  const body = await req.json() as {
    label?: string;
    url?: string;
    icon?: string;
    minRole?: 'admin' | 'user';
    openInIframe?: boolean;
    enabled?: boolean;
  };

  updateTab(id, {
    label: body.label?.trim(),
    url: body.url?.trim(),
    icon: body.icon?.trim(),
    minRole: body.minRole,
    openInIframe: body.openInIframe,
    enabled: body.enabled,
  });

  const updated = db.select().from(tabs).where(eq(tabs.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = db.select().from(tabs).where(eq(tabs.id, id)).get();
  if (!existing) return NextResponse.json({ error: 'Tab not found' }, { status: 404 });

  deleteTab(id);
  return NextResponse.json({ ok: true });
}
