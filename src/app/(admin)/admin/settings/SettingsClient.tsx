'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ColourPicker from '@/components/admin/ColourPicker';
import { themes, ThemeVars } from '@/lib/themes';
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_REQUIRED_MODULE,
  DEFAULT_WIDGET_CONFIG,
} from '@/lib/widgetConfig';
import type { WidgetConfig, WidgetId } from '@/lib/widgetConfig';

type Tab = 'appearance' | 'login' | 'donations' | 'general' | 'dashboard';

interface InitialSettings {
  theme_preset: string;
  theme_overrides: Partial<ThemeVars>;
  login_site_name: string;
  login_bg_image: string;
  login_card_opacity: number;
  donation_enabled: boolean;
  donation_provider: string;
  donation_url: string;
  donation_label: string;
  donation_placement: string;
  site_name: string;
  admin_email: string;
  tmdb_api_key: string;
  dashboard_config: WidgetConfig[];
}

const VAR_GROUPS: { label: string; vars: (keyof ThemeVars)[] }[] = [
  { label: 'Background', vars: ['--color-bg', '--color-surface'] },
  { label: 'Navigation', vars: ['--color-sidebar', '--color-navbar'] },
  { label: 'Text', vars: ['--color-text', '--color-text-muted', '--color-sidebar-text', '--color-navbar-text'] },
  { label: 'Accent', vars: ['--color-accent', '--color-accent-text'] },
  { label: 'Button', vars: ['--color-button', '--color-button-text'] },
  { label: 'Border', vars: ['--color-border'] },
];

const VAR_LABELS: Record<keyof ThemeVars, string> = {
  '--color-bg': 'Page background',
  '--color-surface': 'Surface / cards',
  '--color-sidebar': 'Sidebar background',
  '--color-navbar': 'Navbar background',
  '--color-text': 'Primary text',
  '--color-text-muted': 'Muted text',
  '--color-sidebar-text': 'Sidebar text',
  '--color-navbar-text': 'Navbar text',
  '--color-accent': 'Accent',
  '--color-accent-text': 'Accent text',
  '--color-button': 'Button background',
  '--color-button-text': 'Button text',
  '--color-border': 'Borders',
};

function moduleLabel(id: WidgetId): string {
  const req = WIDGET_REQUIRED_MODULE[id];
  if (!req) return '';
  if (req === 'tabs') return 'Active tabs';
  if (Array.isArray(req)) return req.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(' or ');
  return req.charAt(0).toUpperCase() + req.slice(1);
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-(--color-accent) text-(--color-accent-text) px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg">
      {message}
    </div>
  );
}

export default function SettingsClient({ initial }: { initial: InitialSettings }) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [themePreset, setThemePreset] = useState(initial.theme_preset);
  const [overrides, setOverrides] = useState<Partial<ThemeVars>>(initial.theme_overrides);

  const [loginSiteName, setLoginSiteName] = useState(initial.login_site_name);
  const [loginBgImage, setLoginBgImage] = useState(initial.login_bg_image);
  const [loginCardOpacity, setLoginCardOpacity] = useState(initial.login_card_opacity);

  const [donationEnabled, setDonationEnabled] = useState(initial.donation_enabled);
  const [donationProvider, setDonationProvider] = useState(initial.donation_provider);
  const [donationUrl, setDonationUrl] = useState(initial.donation_url);
  const [donationLabel, setDonationLabel] = useState(initial.donation_label);
  const [donationPlacement, setDonationPlacement] = useState(initial.donation_placement);

  const [siteName, setSiteName] = useState(initial.site_name);
  const [adminEmail, setAdminEmail] = useState(initial.admin_email);
  const [tmdbApiKey, setTmdbApiKey] = useState(initial.tmdb_api_key);

  // Dashboard widget config
  const [dashboardConfig, setDashboardConfig] = useState<WidgetConfig[]>(() => {
    // Merge stored config with defaults — ensure all known widgets are present
    const stored = initial.dashboard_config;
    const storedIds = new Set(stored.map((c) => c.id));
    const missing = DEFAULT_WIDGET_CONFIG.filter((c) => !storedIds.has(c.id));
    return [...stored, ...missing];
  });
  const dragIdxRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const activeTheme = themes.find((t) => t.id === themePreset) ?? themes[0];

  useEffect(() => {
    const vars = { ...activeTheme.vars, ...overrides };
    for (const [k, v] of Object.entries(vars)) {
      document.documentElement.style.setProperty(k, v);
    }
  }, [themePreset, overrides, activeTheme.vars]);

  const resolvedValue = (v: keyof ThemeVars): string =>
    overrides[v] ?? activeTheme.vars[v];

  const handleOverride = useCallback((v: keyof ThemeVars, value: string) => {
    document.documentElement.style.setProperty(v, value);
    setOverrides((prev) => ({ ...prev, [v]: value }));
  }, []);

  const handleReset = useCallback((v: keyof ThemeVars) => {
    document.documentElement.style.setProperty(v, activeTheme.vars[v]);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[v];
      return next;
    });
  }, [activeTheme.vars]);

  const handleSelectPreset = (id: string) => {
    setThemePreset(id);
    setOverrides({});
  };

  // Dashboard drag-and-drop handlers
  function handleDragStart(e: React.DragEvent, idx: number) {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    const fromIdx = dragIdxRef.current;
    dragIdxRef.current = null;
    setDragOverIdx(null);
    if (fromIdx === null || fromIdx === targetIdx) return;
    setDashboardConfig((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(targetIdx, 0, item);
      return next;
    });
  }

  function handleDragEnd() {
    dragIdxRef.current = null;
    setDragOverIdx(null);
  }

  function toggleWidget(id: WidgetId) {
    setDashboardConfig((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    );
  }

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_preset: themePreset,
          theme_overrides: overrides,
          login_site_name: loginSiteName,
          login_bg_image: loginBgImage,
          login_card_opacity: loginCardOpacity,
          donation_enabled: donationEnabled,
          donation_provider: donationProvider,
          donation_url: donationUrl,
          donation_label: donationLabel,
          donation_placement: donationPlacement,
          site_name: siteName,
          admin_email: adminEmail,
          tmdb_api_key: tmdbApiKey,
          dashboard_config: dashboardConfig,
        }),
      });
      setToast('Settings saved');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'appearance', label: 'Appearance' },
    { id: 'login', label: 'Login Page' },
    { id: 'donations', label: 'Donations' },
    { id: 'general', label: 'General' },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <div className="max-w-2xl">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-(--color-border) mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-(--color-accent) text-(--color-accent)'
                : 'border-transparent text-(--color-text-muted) hover:text-(--color-text)'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Appearance */}
      {activeTab === 'appearance' && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-(--color-text) mb-3">Theme Preset</h2>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectPreset(theme.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    themePreset === theme.id
                      ? 'border-(--color-accent)'
                      : 'border-(--color-border) hover:border-(--color-text-muted)'
                  }`}
                  style={{ background: theme.vars['--color-sidebar'] }}
                >
                  <div className="flex gap-1 mb-2">
                    {(['--color-accent', '--color-surface', '--color-bg'] as const).map((v) => (
                      <div
                        key={v}
                        className="w-4 h-4 rounded-full"
                        style={{ background: theme.vars[v] }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: theme.vars['--color-text'] }}>
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-(--color-text) mb-1">Colour Overrides</h2>
            <p className="text-xs text-(--color-text-muted) mb-4">
              Customise individual colours. &quot;Reset&quot; restores the theme default.
            </p>
            <div className="space-y-5">
              {VAR_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest mb-2">
                    {group.label}
                  </div>
                  <div className="space-y-2">
                    {group.vars.map((v) => (
                      <ColourPicker
                        key={v}
                        label={VAR_LABELS[v]}
                        value={resolvedValue(v)}
                        isOverridden={v in overrides}
                        onChange={(val) => handleOverride(v, val)}
                        onReset={() => handleReset(v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Login Page */}
      {activeTab === 'login' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">
              Site name on login page
            </label>
            <input
              type="text"
              value={loginSiteName}
              onChange={(e) => setLoginSiteName(e.target.value)}
              placeholder="Atrium"
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">
              Background image path
            </label>
            <input
              type="text"
              value={loginBgImage}
              onChange={(e) => setLoginBgImage(e.target.value)}
              placeholder="/images/background.jpg"
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Path relative to the /public folder. Leave blank for no background.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">
              Login card opacity — {loginCardOpacity}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={loginCardOpacity}
              onChange={(e) => setLoginCardOpacity(Number(e.target.value))}
              className="w-full accent-(--color-accent)"
            />
          </div>
        </div>
      )}

      {/* Donations */}
      {activeTab === 'donations' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-(--color-text)">Enable donation button</div>
              <div className="text-xs text-(--color-text-muted) mt-0.5">
                Shows a button in the sidebar for users to support you.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={donationEnabled}
              onClick={() => setDonationEnabled((v) => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                donationEnabled ? 'bg-(--color-accent)' : 'bg-(--color-border)'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  donationEnabled
                    ? 'translate-x-5 bg-(--color-accent-text)'
                    : 'translate-x-1 bg-(--color-text-muted)'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">Provider</label>
            <select
              value={donationProvider}
              onChange={(e) => setDonationProvider(e.target.value)}
              disabled={!donationEnabled}
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:outline-none focus:border-(--color-accent) disabled:opacity-50"
            >
              <option value="">Select a provider…</option>
              <option value="kofi">Ko-fi</option>
              <option value="patreon">Patreon</option>
              <option value="paypal">PayPal</option>
              <option value="bmac">Buy Me a Coffee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">Donation URL</label>
            <input
              type="url"
              value={donationUrl}
              onChange={(e) => setDonationUrl(e.target.value)}
              disabled={!donationEnabled}
              placeholder="https://ko-fi.com/yourname"
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent) disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">Button label</label>
            <input
              type="text"
              value={donationLabel}
              onChange={(e) => setDonationLabel(e.target.value)}
              disabled={!donationEnabled}
              placeholder="Support Atrium"
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent) disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">Placement</label>
            <select
              value={donationPlacement}
              onChange={(e) => setDonationPlacement(e.target.value)}
              disabled={!donationEnabled}
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:outline-none focus:border-(--color-accent) disabled:opacity-50"
            >
              <option value="sidebar">Sidebar (above user section)</option>
              <option value="footer">Footer (bottom of page)</option>
              <option value="dashboard">Dashboard (widget)</option>
            </select>
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Where the donation button appears for users.
            </p>
          </div>
        </div>
      )}

      {/* General */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">Site name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Atrium"
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Displayed in the browser tab and sidebar header.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">Admin email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Used as the From address for system emails.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-(--color-text) mb-1.5">TMDB API key</label>
            <input
              type="password"
              value={tmdbApiKey}
              onChange={(e) => setTmdbApiKey(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              autoComplete="new-password"
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
            />
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Optional. Used to load poster images from TMDB instead of through Tautulli.
              Free API keys available at{' '}
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--color-accent) hover:underline"
              >
                themoviedb.org
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-(--color-text) mb-1">Widget order &amp; visibility</h2>
            <p className="text-xs text-(--color-text-muted)">
              Drag to reorder. Toggle to show or hide each widget. Widgets whose required module is not enabled will not appear regardless of this setting.
            </p>
          </div>

          <div className="space-y-1.5">
            {dashboardConfig.map((widget, idx) => {
              const label = WIDGET_DISPLAY_NAMES[widget.id];
              const modLabel = moduleLabel(widget.id);
              const isOver = dragOverIdx === idx;
              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors select-none ${
                    isOver
                      ? 'border-(--color-accent) bg-(--color-accent)/5'
                      : 'border-(--color-border) bg-(--color-bg)'
                  }`}
                >
                  {/* Drag handle */}
                  <div className="cursor-grab shrink-0 text-(--color-text-muted) hover:text-(--color-text)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </div>

                  {/* Label + module requirement */}
                  <div className="flex-1 min-w-0 flex items-baseline gap-2">
                    <span className="text-sm font-medium text-(--color-text)">{label}</span>
                    {modLabel && (
                      <span className="text-xs text-(--color-text-muted) truncate">· {modLabel}</span>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={widget.enabled}
                    onClick={() => toggleWidget(widget.id)}
                    className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${
                      widget.enabled ? 'bg-(--color-accent)' : 'bg-(--color-border)'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                        widget.enabled
                          ? 'translate-x-5 bg-(--color-accent-text)'
                          : 'translate-x-1 bg-(--color-text-muted)'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-(--color-text-muted) pt-1">
            Changes take effect after saving.
          </p>
        </div>
      )}

      {/* Save bar */}
      <div className="mt-8 pt-5 border-t border-(--color-border) flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-(--color-button) text-(--color-button-text) text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
