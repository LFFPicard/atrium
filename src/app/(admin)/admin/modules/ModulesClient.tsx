'use client';

import { useState, useCallback, useRef } from 'react';
import { ModuleDefinition, ModuleRecord } from '@/lib/modules';
import type { TestResult } from '@/lib/module-tests';

type ModuleStatus = 'enabled' | 'misconfigured' | 'disabled';

interface ModuleState {
  enabled: boolean;
  config: Record<string, string>;
}

function statusFor(enabled: boolean, configured: boolean): ModuleStatus {
  if (!enabled) return 'disabled';
  if (!configured) return 'misconfigured';
  return 'enabled';
}

function StatusDot({ status }: { status: ModuleStatus }) {
  const colours: Record<ModuleStatus, string> = {
    enabled: 'bg-emerald-500',
    misconfigured: 'bg-amber-400',
    disabled: 'bg-(--color-border)',
  };
  const labels: Record<ModuleStatus, string> = {
    enabled: 'Enabled',
    misconfigured: 'Missing config',
    disabled: 'Disabled',
  };
  return (
    <span className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
      <span className={`w-2 h-2 rounded-full ${colours[status]}`} />
      {labels[status]}
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-(--color-accent)' : 'bg-(--color-border)'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
          checked ? 'translate-x-5 bg-(--color-accent-text)' : 'translate-x-1 bg-(--color-text-muted)'
        }`}
      />
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="w-3.5 h-3.5 animate-spin text-(--color-text-muted)"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function TestResultBadge({ result }: { result: TestResult }) {
  if (result.success) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {result.message}
        {result.version && <span className="text-emerald-500/70">v{result.version}</span>}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      {result.message}
    </span>
  );
}

const TESTABLE_SLUGS = new Set(['tautulli', 'sonarr', 'radarr', 'jellyfin', 'overseerr']);

function ModuleCard({
  def,
  record,
}: {
  def: ModuleDefinition;
  record: ModuleRecord;
}) {
  const initialConfigComplete = def.configFields.length === 0 ||
    def.configFields.every((f) => !!record.config[f.key]);

  const [state, setState] = useState<ModuleState>({
    enabled: record.enabled,
    config: { ...record.config },
  });
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Track whether the most recently *saved* config has all required fields
  const [savedConfigComplete, setSavedConfigComplete] = useState(initialConfigComplete);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const clearTestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allFilled = def.configFields.length === 0 ||
    def.configFields.every((f) => !!state.config[f.key]);

  const status = statusFor(state.enabled, initialConfigComplete);

  const canTest = TESTABLE_SLUGS.has(def.slug) && savedConfigComplete;

  const setConfigField = useCallback((key: string, value: string) => {
    setState((prev) => ({ ...prev, config: { ...prev.config, [key]: value } }));
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setState((prev) => ({ ...prev, enabled }));
    await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: def.slug, enabled }),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const shouldEnable = allFilled;
      await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: def.slug,
          config: state.config,
          enabled: shouldEnable ? true : state.enabled,
        }),
      });
      if (shouldEnable) {
        setState((prev) => ({ ...prev, enabled: true }));
      }
      setSavedConfigComplete(allFilled);
      setToast('Saved');
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (clearTestTimer.current) clearTimeout(clearTestTimer.current);
    setTestResult(null);
    setTesting(true);
    try {
      const res = await fetch(`/api/modules/${def.slug}/test`, { method: 'POST' });
      const data = await res.json() as TestResult;
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: 'Request failed — check the browser console' });
    } finally {
      setTesting(false);
      clearTestTimer.current = setTimeout(() => setTestResult(null), 10000);
    }
  };

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-(--color-text)">{def.name}</span>
            <StatusDot status={status} />
          </div>
          <p className="text-xs text-(--color-text-muted) leading-relaxed">{def.description}</p>
          {def.unlocks.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {def.unlocks.map((u) => (
                <span
                  key={u}
                  className="text-xs px-1.5 py-0.5 rounded bg-(--color-bg) border border-(--color-border) text-(--color-text-muted)"
                >
                  {u}
                </span>
              ))}
            </div>
          )}
        </div>
        <Toggle checked={state.enabled} onChange={handleToggle} />
      </div>

      {def.configFields.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-4 py-2.5 border-t border-(--color-border) text-xs text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg) transition-colors"
          >
            <span>Configure</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-4 pb-4 border-t border-(--color-border) space-y-3 pt-3">
              {def.configFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-(--color-text) mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                    value={state.config[field.key] ?? ''}
                    onChange={(e) => setConfigField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
                  />
                </div>
              ))}

              {allFilled && !state.enabled && (
                <p className="text-xs text-emerald-500">
                  All fields filled — saving will enable this module automatically.
                </p>
              )}

              {/* Test result */}
              {testResult && <TestResultBadge result={testResult} />}

              {/* Actions row */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  {canTest && (
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--color-border) text-xs font-medium text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-accent) transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {testing ? (
                        <>
                          <Spinner />
                          Testing…
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          Test connection
                        </>
                      )}
                    </button>
                  )}
                  {toast && <span className="text-xs text-emerald-500">{toast}</span>}
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-(--color-button) text-(--color-button-text) text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
                >
                  {saving ? 'Saving…' : 'Save config'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ModulesClient({
  definitions,
  records,
}: {
  definitions: ModuleDefinition[];
  records: ModuleRecord[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {definitions.map((def) => {
        const record = records.find((r) => r.id === def.slug) ?? {
          id: def.slug,
          enabled: false,
          config: {},
        };
        return <ModuleCard key={def.slug} def={def} record={record} />;
      })}
    </div>
  );
}
