import { db } from '@/lib/db';
import { uptimeChecks } from '@/lib/db/schema';
import { runCheck } from './checker';
import { notifyStatusChange } from './notifier';

let started = false;

export function startPoller(): void {
  if (started) return;
  started = true;

  const tick = async () => {
    const now = Math.floor(Date.now() / 1000);
    let checks: (typeof uptimeChecks.$inferSelect)[];
    try {
      checks = db.select().from(uptimeChecks).all();
    } catch {
      return;
    }

    const due = checks.filter((c) => {
      if (!c.enabled) return false;
      if (!c.lastCheckedAt) return true;
      return now >= c.lastCheckedAt + c.intervalMinutes * 60;
    });

    for (const check of due) {
      try {
        const { oldStatus, newStatus } = await runCheck(check);
        await notifyStatusChange(check, oldStatus, newStatus);
      } catch {
        // individual check failure must not stop the poller
      }
    }
  };

  void tick();
  setInterval(() => void tick(), 60_000);
}
