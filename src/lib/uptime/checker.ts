import { randomUUID } from 'crypto';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from '@/lib/db';
import { uptimeChecks, uptimeEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { testModuleConnection } from '@/lib/module-tests';
import { getModule } from '@/lib/modules';

export type CheckRow = InferSelectModel<typeof uptimeChecks>;
export type UptimeStatus = 'up' | 'degraded' | 'down' | 'unknown';

async function pingCustom(url: string): Promise<{ ok: boolean; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const start = Date.now();
  try {
    await fetch(url, { signal: controller.signal, redirect: 'follow' });
    return { ok: true, ms: Date.now() - start };
  } catch {
    return { ok: false, ms: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

export async function runCheck(check: CheckRow): Promise<{
  oldStatus: UptimeStatus;
  newStatus: UptimeStatus;
  responseMs: number;
}> {
  const oldStatus = check.lastStatus as UptimeStatus;
  let ok = false;
  let responseMs = 0;

  if (check.serviceType === 'module' && check.moduleSlug) {
    const start = Date.now();
    const record = getModule(check.moduleSlug);
    const result = await testModuleConnection(check.moduleSlug, record.config);
    responseMs = Date.now() - start;
    ok = result.success;
  } else {
    const result = await pingCustom(check.url);
    ok = result.ok;
    responseMs = result.ms;
  }

  const newFailures = ok ? 0 : check.consecutiveFailures + 1;
  let newStatus: 'up' | 'degraded' | 'down';
  if (ok) {
    newStatus = 'up';
  } else if (newFailures >= 3) {
    newStatus = 'down';
  } else {
    newStatus = 'degraded';
  }

  const now = Math.floor(Date.now() / 1000);

  db.insert(uptimeEvents).values({
    id: randomUUID(),
    checkId: check.id,
    status: newStatus,
    responseMs,
    checkedAt: now,
  }).run();

  db.update(uptimeChecks).set({
    consecutiveFailures: newFailures,
    lastStatus: newStatus,
    lastCheckedAt: now,
  }).where(eq(uptimeChecks.id, check.id)).run();

  return { oldStatus, newStatus, responseMs };
}
