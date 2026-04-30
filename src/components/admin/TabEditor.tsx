'use client';

import { useState, useEffect } from 'react';
import type { TabRow } from '@/lib/tabs';

interface CreateProps {
  mode: 'create';
  tab?: undefined;
  onClose: () => void;
  onSuccess: (tab: TabRow) => void;
}

interface EditProps {
  mode: 'edit';
  tab: TabRow;
  onClose: () => void;
  onSuccess: (tab: TabRow) => void;
}

type TabEditorProps = CreateProps | EditProps;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-(--color-text)">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-(--color-accent)' : 'bg-(--color-border)'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
            checked ? 'translate-x-5 bg-(--color-accent-text)' : 'translate-x-1 bg-(--color-text-muted)'
          }`}
        />
      </button>
    </div>
  );
}

export default function TabEditor({ mode, tab, onClose, onSuccess }: TabEditorProps) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [minRole, setMinRole] = useState<'admin' | 'user'>('user');
  const [openInIframe, setOpenInIframe] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && tab) {
      setLabel(tab.label);
      setUrl(tab.url);
      setIcon(tab.icon);
      setMinRole(tab.minRole);
      setOpenInIframe(tab.openInIframe);
      setEnabled(tab.enabled);
    }
  }, [mode, tab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      label: label.trim(),
      url: url.trim(),
      icon: icon.trim(),
      minRole,
      openInIframe,
      enabled,
    };

    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/tabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/tabs/${tab.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json() as TabRow & { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to save tab'); return; }
      onSuccess(data);
    } finally {
      setSaving(false);
    }
  }

  const slugPreview = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-') || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-(--color-surface) border border-(--color-border) rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
          <h2 className="text-sm font-semibold text-(--color-text)">
            {mode === 'create' ? 'Add Tab' : `Edit — ${tab.label}`}
          </h2>
          <button type="button" onClick={onClose} className="text-(--color-text-muted) hover:text-(--color-text) transition-colors" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="Sonarr"
              className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
            {mode === 'create' && slugPreview && (
              <p className="mt-1 text-xs text-(--color-text-muted)">
                URL: <span className="font-mono">/tab/{slugPreview}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1.5">Service URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://sonarr.example.com"
              className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1.5">
              Icon URL
              <span className="text-(--color-text-muted) font-normal ml-1">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              {icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={icon}
                  alt=""
                  className="w-8 h-8 rounded object-contain bg-(--color-bg) border border-(--color-border) shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="https://example.com/icon.png"
                className="flex-1 bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1.5">Minimum role</label>
            <select
              value={minRole}
              onChange={(e) => setMinRole(e.target.value as 'admin' | 'user')}
              className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:outline-none focus:border-(--color-accent)"
            >
              <option value="user">All users</option>
              <option value="admin">Admins only</option>
            </select>
          </div>

          <div className="space-y-3 pt-1 border-t border-(--color-border)">
            <Toggle checked={openInIframe} onChange={setOpenInIframe} label="Open in iFrame" />
            <Toggle checked={enabled} onChange={setEnabled} label="Enabled" />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-(--color-button) text-(--color-button-text) text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? 'Saving…' : mode === 'create' ? 'Add tab' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
