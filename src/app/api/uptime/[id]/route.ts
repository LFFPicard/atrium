import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { uptimeChecks, uptimeEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = db.select().from(uptimeChecks).where(eq(uptimeChecks.id, id)).get();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as Partial<{
    serviceName: string;
    url: string;
    intervalMinutes: number;
    enabled: boolean;
    notifyEmail: boolean;
    notifyWebhook: boolean;
    public: boolean;
  }>;

  const setter: Record<string, unknown> = {};
  if (body.serviceName !== undefined) setter.serviceName = body.serviceName;
  if (body.url !== undefined) setter.url = body.url;
  if (body.intervalMinutes !== undefined) setter.intervalMinutes = body.intervalMinutes;
  if (body.enabled !== undefined) setter.enabled = body.enabled;
  if (body.notifyEmail !== undefined) setter.notifyEmail = body.notifyEmail;
  if (body.notifyWebhook !== undefined) setter.notifyWebhook = body.notifyWebhook;
  if (body.public !== undefined) setter.public = body.public;

  if (Object.keys(setter).length > 0) {
    db.update(uptimeChecks)
      .set(setter as Parameters<ReturnType<typeof db.update<typeof uptimeChecks>>['set']>[0])
      .where(eq(uptimeChecks.id, id))
      .run();
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = db.select().from(uptimeChecks).where(eq(uptimeChecks.id, id)).get();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.delete(uptimeEvents).where(eq(uptimeEvents.checkId, id)).run();
  db.delete(uptimeChecks).where(eq(uptimeChecks.id, id)).run();

  return NextResponse.json({ ok: true });
}
