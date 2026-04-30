import Link from 'next/link';
import { db } from '@/lib/db';
import { users, tabs, messages, uptimeChecks } from '@/lib/db/schema';
import { getAllModules, isModuleConfigured, MODULE_DEFINITIONS } from '@/lib/modules';
import { desc } from 'drizzle-orm';

const VERSION = '0.1.0';

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 flex flex-col gap-1 hover:border-(--color-accent) transition-colors"
    >
      <span className="text-2xl font-bold text-(--color-text) tabular-nums">{value}</span>
      <span className="text-xs text-(--color-text-muted)">{label}</span>
    </Link>
  );
}

function formatTime(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminPage() {
  const allUsers = db.select({ id: users.id }).from(users).all();
  const allTabs = db.select({ id: tabs.id, enabled: tabs.enabled }).from(tabs).all();
  const allModules = getAllModules();
  const allChecks = db.select({ id: uptimeChecks.id, enabled: uptimeChecks.enabled }).from(uptimeChecks).all();

  const recentMessages = db
    .select({
      id: messages.id,
      subject: messages.subject,
      fromUserId: messages.fromUserId,
      createdAt: messages.createdAt,
      read: messages.read,
    })
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(5)
    .all();

  const userMap = new Map(
    db.select({ id: users.id, username: users.username }).from(users).all().map((u) => [u.id, u.username]),
  );

  const enabledModules = allModules.filter((m) => m.enabled);
  const enabledTabs = allTabs.filter((t) => t.enabled);
  const enabledChecks = allChecks.filter((c) => c.enabled);

  const moduleStatuses = MODULE_DEFINITIONS.map((def) => {
    const record = allModules.find((r) => r.id === def.slug);
    const enabled = record?.enabled ?? false;
    const configured = isModuleConfigured(def.slug);
    return { slug: def.slug, name: def.name, enabled, configured };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-(--color-text)">Admin Overview</h1>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Atrium v{VERSION}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total users" value={allUsers.length} href="/admin/users" />
        <StatCard label="Active modules" value={enabledModules.length} href="/admin/modules" />
        <StatCard label="Enabled tabs" value={enabledTabs.length} href="/admin/tabs" />
        <StatCard label="Uptime checks" value={enabledChecks.length} href="/admin/uptime" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent messages */}
        <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
            <p className="text-sm font-semibold text-(--color-text)">Recent Messages</p>
            <Link href="/messages" className="text-xs text-(--color-accent) hover:underline">View all</Link>
          </div>
          {recentMessages.length === 0 ? (
            <p className="px-4 py-6 text-sm text-(--color-text-muted) text-center">No messages yet.</p>
          ) : (
            <div className="divide-y divide-(--color-border)">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${msg.read ? 'bg-transparent' : 'bg-(--color-accent)'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-(--color-text) truncate">{msg.subject}</p>
                    <p className="text-xs text-(--color-text-muted)">
                      from {userMap.get(msg.fromUserId) ?? 'Unknown'} · {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module status */}
        <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
            <p className="text-sm font-semibold text-(--color-text)">Module Status</p>
            <Link href="/admin/modules" className="text-xs text-(--color-accent) hover:underline">Configure</Link>
          </div>
          <div className="divide-y divide-(--color-border)">
            {moduleStatuses.map(({ slug, name, enabled, configured }) => (
              <div key={slug} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-(--color-text)">{name}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full ${
                    !enabled ? 'bg-(--color-border)' : !configured ? 'bg-amber-400' : 'bg-emerald-500'
                  }`} />
                  <span className="text-(--color-text-muted)">
                    {!enabled ? 'Disabled' : !configured ? 'Misconfigured' : 'Active'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4">
        <p className="text-sm font-semibold text-(--color-text) mb-3">Quick Links</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/admin/users', label: 'Manage Users' },
            { href: '/admin/tabs', label: 'Tab Manager' },
            { href: '/admin/modules', label: 'Modules' },
            { href: '/admin/uptime', label: 'Uptime Monitor' },
            { href: '/admin/settings', label: 'Settings' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-accent) transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
