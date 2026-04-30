import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { uptimeChecks, uptimeEvents } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { getSetting } from '@/lib/settings';
import UptimeClient, { type CheckWithStats } from './UptimeClient';

export const metadata = { title: 'Uptime Monitor — Atrium' };

function getStats(checkId: string): { uptimePct: number; lastResponseMs: number | null } {
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

export default async function UptimePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard');

  const rows = db.select().from(uptimeChecks).all();
  const checks: CheckWithStats[] = rows.map((r) => ({ ...r, ...getStats(r.id) }));
  const webhookUrl = getSetting<string>('uptime_webhook_url') ?? '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--color-text)">Uptime Monitor</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">
          Track the availability of your services. Module checks are created automatically when you enable and configure a module.
        </p>
      </div>
      <UptimeClient checks={checks} webhookUrl={webhookUrl} />
    </div>
  );
}
