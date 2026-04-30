import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { uptimeChecks, uptimeEvents } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

function computeStats(checkId: string): { uptimePct: number; lastResponseMs: number | null } {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const events = db
    .select({ status: uptimeEvents.status })
    .from(uptimeEvents)
    .where(and(eq(uptimeEvents.checkId, checkId), gte(uptimeEvents.checkedAt, thirtyDaysAgo)))
    .all();
  const uptimePct = events.length === 0
    ? 100
    : Math.round((events.filter((e) => e.status === 'up').length / events.length) * 100);

  const last = db
    .select({ responseMs: uptimeEvents.responseMs })
    .from(uptimeEvents)
    .where(eq(uptimeEvents.checkId, checkId))
    .orderBy(desc(uptimeEvents.checkedAt))
    .limit(1)
    .get();
  return { uptimePct, lastResponseMs: last?.responseMs ?? null };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = session.user.role === 'admin';
  const all = db.select().from(uptimeChecks).all();
  const checks = isAdmin ? all : all.filter((c) => c.public && c.enabled);

  return NextResponse.json(checks.map((c) => ({ ...c, ...computeStats(c.id) })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    serviceName: string;
    url: string;
    intervalMinutes?: number;
    notifyEmail?: boolean;
    notifyWebhook?: boolean;
    public?: boolean;
  };

  if (!body.serviceName || !body.url) {
    return NextResponse.json({ error: 'serviceName and url are required' }, { status: 400 });
  }

  const id = randomUUID();
  db.insert(uptimeChecks).values({
    id,
    serviceName: body.serviceName,
    serviceType: 'custom',
    moduleSlug: null,
    url: body.url,
    enabled: true,
    intervalMinutes: body.intervalMinutes ?? 15,
    consecutiveFailures: 0,
    lastStatus: 'unknown',
    lastCheckedAt: null,
    lastNotifiedAt: null,
    notifyEmail: body.notifyEmail ?? false,
    notifyWebhook: body.notifyWebhook ?? false,
    public: body.public ?? false,
  }).run();

  return NextResponse.json({ id });
}
