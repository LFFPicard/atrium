'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type UptimeStatus = 'up' | 'degraded' | 'down' | 'unknown';

export interface CheckWithStats {
  id: string;
  serviceName: string;
  serviceType: 'module' | 'custom';
  moduleSlug: string | null;
  url: string;
  enabled: boolean;
  intervalMinutes: number;
  lastStatus: UptimeStatus;
  lastCheckedAt: number | null;
  notifyEmail: boolean;
  notifyWebhook: boolean;
  public: boolean;
  uptimePct: number;
  lastResponseMs: number | null;
}

interface ModalState {
  mode: 'add' | 'edit';
  check?: CheckWithStats;
}

const STATUS_CONFIG: Record<UptimeStatus, { dot: string; label: string }> = {
  up: { dot: 'bg-emerald-500', label: 'Up' },
  degraded: { dot: 'bg-amber-400', label: 'Degraded' },
  down: { dot: 'bg-red-500', label: 'Down' },
  unknown: { dot: 'bg-(--color-border)', label: 'Unknown' },
};

function StatusDot({ status }: { status: UptimeStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function timeAgo(ts: number | null): string {
  if (!ts) return 'Never';
  const secs = Math.floor(Date.now() / 1000) - ts;
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface CheckModalProps {
  initial?: CheckWithStats;
  onClose: () => void;
  onSaved: () => void;
}

function CheckModal({ initial, onClose, onSaved }: CheckModalProps) {
  const [serviceName, setServiceName] = useState(initial?.serviceName ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [intervalMinutes, setIntervalMinutes] = useState(initial?.intervalMinutes ?? 15);
  const [notifyEmail, setNotifyEmail] = useState(initial?.notifyEmail ?? false);
  const [notifyWebhook, setNotifyWebhook] = useState(initial?.notifyWebhook ?? false);
  const [isPublic, setIsPublic] = useState(initial?.public ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { serviceName, url, intervalMinutes, notifyEmail, notifyWebhook, public: isPublic };
      const res = initial
        ? await fetch(`/api/uptime/${initial.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/uptime', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Failed to save');
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
          <h2 className="text-sm font-semibold text-(--color-text)">
            {initial ? 'Edit check' : 'Add custom check'}
          </h2>
          <button onClick={onClose} className="text-(--color-text-muted) hover:text-(--color-text) transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1">Service name</label>
            <input
              type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)}
              placeholder="My Router" required
              className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1">URL to ping</label>
            <input
              type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://192.168.1.1" required
              className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1">Check interval (minutes)</label>
            <input
              type="number" value={intervalMinutes} min={1} max={1440}
              onChange={(e) => setIntervalMinutes(parseInt(e.target.value, 10) || 15)}
              className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:outline-none focus:border-(--color-accent)"
            />
          </div>
          <div className="space-y-2">
            {[
              { value: notifyEmail, set: setNotifyEmail, label: 'Notify via email when status changes (requires SMTP)' },
              { value: notifyWebhook, set: setNotifyWebhook, label: 'Notify via webhook when status changes' },
              { value: isPublic, set: setIsPublic, label: 'Show on user-facing status widget' },
            ].map(({ value, set, label }) => (
              <label key={label} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox" checked={value} onChange={(e) => set(e.target.checked)}
                  className="w-4 h-4 accent-(--color-accent)"
                />
                <span className="text-xs text-(--color-text-muted)">{label}</span>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-(--color-border) text-xs font-medium text-(--color-text-muted) hover:text-(--color-text) transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-(--color-button) text-(--color-button-text) text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UptimeClient({
  checks: initialChecks,
  webhookUrl: initialWebhookUrl,
}: {
  checks: CheckWithStats[];
  webhookUrl: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [webhookSaved, setWebhookSaved] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
    setModal(null);
  }, [router]);

  const handleDelete = async (check: CheckWithStats) => {
    if (!confirm(`Delete "${check.serviceName}"? This will remove all history.`)) return;
    await fetch(`/api/uptime/${check.id}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleToggle = async (check: CheckWithStats) => {
    await fetch(`/api/uptime/${check.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !check.enabled }),
    });
    router.refresh();
  };

  const handleSaveWebhook = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uptime_webhook_url: webhookUrl }),
    });
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  };

  const sorted = [...initialChecks].sort((a, b) => {
    if (a.serviceType !== b.serviceType) return a.serviceType === 'module' ? -1 : 1;
    return a.serviceName.localeCompare(b.serviceName);
  });

  return (
    <>
      {modal && (
        <CheckModal
          initial={modal.mode === 'edit' ? modal.check : undefined}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}

      {/* Webhook URL */}
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-(--color-text) mb-3">Discord / Webhook Notifications</p>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/…"
            className="flex-1 bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
          />
          <button
            type="button"
            onClick={handleSaveWebhook}
            className="px-4 py-2 rounded-lg bg-(--color-button) text-(--color-button-text) text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            {webhookSaved ? 'Saved' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-(--color-text-muted) mt-2">
          Discord-compatible webhook URL. Leave blank to disable webhook notifications.
        </p>
      </div>

      {/* Checks table */}
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
          <p className="text-sm font-semibold text-(--color-text)">Services</p>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--color-button) text-(--color-button-text) text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add check
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-(--color-text-muted)">No uptime checks configured.</p>
            <p className="text-xs text-(--color-text-muted) mt-1">Enable a module or add a custom check to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--color-border)">
                  {['Service', 'Status', 'Response', 'Uptime 30d', 'Last checked', 'Interval', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-(--color-text-muted)">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {sorted.map((check) => (
                  <tr key={check.id} className={`${!check.enabled ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-(--color-text)">{check.serviceName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border border-(--color-border) text-(--color-text-muted) ${
                          check.serviceType === 'module' ? 'bg-(--color-bg)' : ''
                        }`}>
                          {check.serviceType}
                        </span>
                      </div>
                      <p className="text-xs text-(--color-text-muted) mt-0.5 truncate max-w-48">{check.url}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={check.lastStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                      {check.lastResponseMs != null ? `${check.lastResponseMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${check.uptimePct >= 99 ? 'text-emerald-400' : check.uptimePct >= 95 ? 'text-amber-400' : 'text-red-400'}`}>
                        {check.uptimePct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-(--color-text-muted)">{timeAgo(check.lastCheckedAt)}</td>
                    <td className="px-4 py-3 text-xs text-(--color-text-muted)">{check.intervalMinutes}m</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggle(check)}
                          title={check.enabled ? 'Disable' : 'Enable'}
                          className="p-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg) transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            {check.enabled
                              ? <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>
                              : <><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></>}
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ mode: 'edit', check })}
                          title="Edit"
                          className="p-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg) transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {check.serviceType === 'custom' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(check)}
                            title="Delete"
                            className="p-1.5 rounded-md text-(--color-text-muted) hover:text-red-400 hover:bg-(--color-bg) transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
