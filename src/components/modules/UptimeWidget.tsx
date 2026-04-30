import { db } from '@/lib/db';
import { uptimeChecks, uptimeEvents } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

type UptimeStatus = 'up' | 'degraded' | 'down' | 'unknown';

const STATUS_CONFIG: Record<UptimeStatus, { dot: string; label: string }> = {
  up: { dot: 'bg-emerald-500', label: 'Up' },
  degraded: { dot: 'bg-amber-400', label: 'Degraded' },
  down: { dot: 'bg-red-500', label: 'Down' },
  unknown: { dot: 'bg-(--color-border)', label: 'Unknown' },
};

function timeAgo(ts: number | null): string {
  if (!ts) return 'Never checked';
  const secs = Math.floor(Date.now() / 1000) - ts;
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
}

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

export default function UptimeWidget({ isAdmin = false }: { isAdmin?: boolean }) {
  const all = db.select().from(uptimeChecks).all();
  const visible = all.filter((c) => c.enabled && (isAdmin || c.public));

  if (visible.length === 0) {
    return (
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4">
        <p className="text-sm font-semibold text-(--color-text) mb-3">Service Status</p>
        <p className="text-xs text-(--color-text-muted)">No public services configured for monitoring.</p>
      </div>
    );
  }

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-(--color-border)">
        <p className="text-sm font-semibold text-(--color-text)">Service Status</p>
      </div>
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {visible.map((check) => {
          const { uptimePct, lastResponseMs } = getStats(check.id);
          const status = check.lastStatus as UptimeStatus;
          const cfg = STATUS_CONFIG[status];
          return (
            <div
              key={check.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-(--color-border) bg-(--color-bg)"
              title={`${uptimePct}% uptime${lastResponseMs != null ? ` · ${lastResponseMs}ms` : ''} · ${timeAgo(check.lastCheckedAt)}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
              <span className="text-xs font-medium text-(--color-text) whitespace-nowrap">{check.serviceName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
