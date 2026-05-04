export type WidgetId =
  | 'now-playing'
  | 'recently-added'
  | 'stats'
  | 'library-stats'
  | 'wrapped'
  | 'overseerr'
  | 'calendar'
  | 'uptime'
  | 'quick-links'
  | 'messages';

export interface WidgetConfig {
  id: WidgetId;
  enabled: boolean;
}

export const FULL_WIDTH_WIDGETS = new Set<WidgetId>([
  'now-playing',
  'recently-added',
  'calendar',
  'quick-links',
]);

export const WIDGET_DISPLAY_NAMES: Record<WidgetId, string> = {
  'now-playing': 'Now Playing',
  'recently-added': 'Recently Added',
  'stats': 'Play Stats',
  'library-stats': 'Library Stats',
  'wrapped': 'Wrapped',
  'overseerr': 'Recent Requests',
  'calendar': 'Calendar',
  'uptime': 'Service Status',
  'quick-links': 'Quick Links',
  'messages': 'Messages',
};

export const WIDGET_REQUIRED_MODULE: Partial<Record<WidgetId, string | string[]>> = {
  'now-playing': 'tautulli',
  'recently-added': 'tautulli',
  'stats': 'tautulli',
  'library-stats': 'tautulli',
  'wrapped': 'tautulli',
  'overseerr': 'overseerr',
  'calendar': ['sonarr', 'radarr'],
  'uptime': 'uptime',
  'quick-links': 'tabs',
  // 'messages' has no module requirement
};

export const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = [
  { id: 'now-playing', enabled: true },
  { id: 'recently-added', enabled: true },
  { id: 'messages', enabled: true },
  { id: 'stats', enabled: true },
  { id: 'library-stats', enabled: true },
  { id: 'wrapped', enabled: true },
  { id: 'overseerr', enabled: true },
  { id: 'calendar', enabled: true },
  { id: 'uptime', enabled: true },
  { id: 'quick-links', enabled: true },
];
