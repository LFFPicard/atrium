import { getAllModules } from '@/lib/modules';
import { getAllTabs } from '@/lib/tabs';
import { getSetting } from '@/lib/settings';
import type { WidgetId, WidgetConfig } from '@/lib/widgetConfig';
import { WIDGET_REQUIRED_MODULE, DEFAULT_WIDGET_CONFIG } from '@/lib/widgetConfig';

export type { WidgetId, WidgetConfig } from '@/lib/widgetConfig';

function isWidgetAvailable(id: WidgetId, enabledModules: Set<string>, hasTabs: boolean): boolean {
  const req = WIDGET_REQUIRED_MODULE[id];
  if (!req) return true;
  if (req === 'tabs') return hasTabs;
  if (Array.isArray(req)) return req.some((m) => enabledModules.has(m));
  return enabledModules.has(req);
}

export function getDashboardWidgets(userRole: string): WidgetId[] {
  const modules = getAllModules();
  const enabledModules = new Set(modules.filter((m) => m.enabled).map((m) => m.id));

  const allTabs = getAllTabs();
  const hasTabs = allTabs.some(
    (t) => t.enabled && (userRole === 'admin' || t.minRole === 'user'),
  );

  const stored = getSetting<WidgetConfig[]>('dashboard_config');
  const config: WidgetConfig[] = stored ?? DEFAULT_WIDGET_CONFIG;

  // Append any widget IDs from new releases not present in the stored config
  const configIds = new Set(config.map((c) => c.id));
  const extra = DEFAULT_WIDGET_CONFIG
    .filter((c) => !configIds.has(c.id))
    .map((c) => ({ id: c.id, enabled: true } satisfies WidgetConfig));

  return [...config, ...extra]
    .filter((entry) => entry.enabled && isWidgetAvailable(entry.id, enabledModules, hasTabs))
    .map((entry) => entry.id);
}
