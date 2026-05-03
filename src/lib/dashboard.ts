import { getAllModules } from '@/lib/modules';
import { getAllTabs } from '@/lib/tabs';

export type WidgetId = 'now-playing' | 'recently-added' | 'stats' | 'wrapped' | 'uptime' | 'quick-links' | 'calendar' | 'overseerr' | 'library-stats';

export function getDashboardWidgets(userRole: string): WidgetId[] {
  const modules = getAllModules();
  const enabled = new Set(modules.filter((m) => m.enabled).map((m) => m.id));

  const allTabs = getAllTabs();
  const hasTabs = allTabs.some(
    (t) => t.enabled && (userRole === 'admin' || t.minRole === 'user'),
  );

  const widgets: WidgetId[] = [];
  if (enabled.has('tautulli')) widgets.push('now-playing', 'recently-added', 'stats', 'library-stats', 'wrapped');
  if (enabled.has('overseerr')) widgets.push('overseerr');
  if (enabled.has('sonarr') || enabled.has('radarr')) widgets.push('calendar');
  if (enabled.has('uptime')) widgets.push('uptime');
  if (hasTabs) widgets.push('quick-links');
  return widgets;
}
