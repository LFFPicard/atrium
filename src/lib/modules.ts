import { db } from '@/lib/db';
import { modules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface ConfigField {
  key: string;
  label: string;
  type: 'url' | 'text' | 'password' | 'number';
  placeholder?: string;
}

export interface ModuleDefinition {
  slug: string;
  name: string;
  description: string;
  configFields: ConfigField[];
  unlocks: string[];
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    slug: 'tautulli',
    name: 'Tautulli',
    description: 'Plex media server statistics and monitoring.',
    configFields: [
      { key: 'tautulli_url', label: 'Tautulli URL', type: 'url', placeholder: 'http://192.168.1.x:8181' },
      { key: 'tautulli_api_key', label: 'API Key', type: 'password', placeholder: 'Your Tautulli API key' },
    ],
    unlocks: ['Stats widget', 'Wrapped', 'Now Playing'],
  },
  {
    slug: 'sonarr',
    name: 'Sonarr',
    description: 'TV series library management and download automation.',
    configFields: [
      { key: 'sonarr_url', label: 'Sonarr URL', type: 'url', placeholder: 'http://192.168.1.x:8989' },
      { key: 'sonarr_api_key', label: 'API Key', type: 'password', placeholder: 'Your Sonarr API key' },
    ],
    unlocks: ['Calendar (TV)', 'Subscriptions (TV)'],
  },
  {
    slug: 'radarr',
    name: 'Radarr',
    description: 'Movie library management and download automation.',
    configFields: [
      { key: 'radarr_url', label: 'Radarr URL', type: 'url', placeholder: 'http://192.168.1.x:7878' },
      { key: 'radarr_api_key', label: 'API Key', type: 'password', placeholder: 'Your Radarr API key' },
    ],
    unlocks: ['Calendar (Movies)', 'Subscriptions (Movies)'],
  },
  {
    slug: 'jellyfin',
    name: 'Jellyfin',
    description: 'Open source media server — enables SSO login and Jellyfin stats.',
    configFields: [
      { key: 'jellyfin_url', label: 'Jellyfin URL', type: 'url', placeholder: 'http://192.168.1.x:8096' },
      { key: 'jellyfin_api_key', label: 'API Key', type: 'password', placeholder: 'Your Jellyfin API key' },
    ],
    unlocks: ['SSO login', 'Stats (Jellyfin)', 'Now Playing'],
  },
  {
    slug: 'overseerr',
    name: 'Seerr',
    description: 'Media request management — supports Jellyseerr and Overseerr.',
    configFields: [
      { key: 'overseerr_url', label: 'Seerr URL', type: 'url', placeholder: 'http://192.168.1.x:5055' },
      { key: 'overseerr_api_key', label: 'API Key', type: 'password', placeholder: 'Your Seerr API key' },
    ],
    unlocks: ['Request inbox widget'],
  },
  {
    slug: 'smtp',
    name: 'SMTP / Email',
    description: 'Send email notifications to users for new episodes and messages.',
    configFields: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.example.com' },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587' },
      { key: 'smtp_user', label: 'Username', type: 'text', placeholder: 'user@example.com' },
      { key: 'smtp_pass', label: 'Password', type: 'password', placeholder: '••••••••' },
      { key: 'smtp_from', label: 'From address', type: 'text', placeholder: 'Atrium <no-reply@example.com>' },
    ],
    unlocks: ['Email notifications'],
  },
  {
    slug: 'webhooks',
    name: 'Webhooks',
    description: 'Receive events from Sonarr, Radarr, and Tautulli to notify subscribed users.',
    configFields: [],
    unlocks: ['Webhook receiver', 'Push notifications'],
  },
  {
    slug: 'donations',
    name: 'Donations',
    description: 'Show a donation button in the sidebar linking to your Ko-fi, PayPal, or similar page.',
    configFields: [
      { key: 'donation_provider', label: 'Provider', type: 'text', placeholder: 'kofi' },
      { key: 'donation_url', label: 'Donation URL', type: 'url', placeholder: 'https://ko-fi.com/yourname' },
      { key: 'donation_label', label: 'Button label', type: 'text', placeholder: 'Support this server' },
    ],
    unlocks: ['Donation button'],
  },
  {
    slug: 'uptime',
    name: 'Uptime Monitor',
    description: 'Monitor your services with background health checks and alerts when something goes down.',
    configFields: [],
    unlocks: ['Uptime monitor', 'Status widget', 'Down alerts'],
  },
  {
    slug: 'demo',
    name: 'Demo Mode',
    description: 'Populate the dashboard with dummy data. Useful for screenshots or showing off Atrium.',
    configFields: [],
    unlocks: ['Demo data on dashboard'],
  },
];

export interface ModuleRecord {
  id: string;
  enabled: boolean;
  config: Record<string, string>;
}

function ensureModule(slug: string): ModuleRecord {
  const existing = db.select().from(modules).where(eq(modules.id, slug)).get();
  if (existing) {
    return { id: existing.id, enabled: existing.enabled, config: JSON.parse(existing.config) as Record<string, string> };
  }
  db.insert(modules).values({ id: slug, enabled: false, config: '{}' }).run();
  return { id: slug, enabled: false, config: {} };
}

export function getModule(slug: string): ModuleRecord {
  return ensureModule(slug);
}

export function getAllModules(): ModuleRecord[] {
  for (const def of MODULE_DEFINITIONS) {
    ensureModule(def.slug);
  }
  const rows = db.select().from(modules).all();
  return rows.map((r) => ({ id: r.id, enabled: r.enabled, config: JSON.parse(r.config) as Record<string, string> }));
}

export function isModuleEnabled(slug: string): boolean {
  return ensureModule(slug).enabled;
}

export function enableModule(slug: string): void {
  ensureModule(slug);
  db.update(modules).set({ enabled: true }).where(eq(modules.id, slug)).run();
}

export function disableModule(slug: string): void {
  ensureModule(slug);
  db.update(modules).set({ enabled: false }).where(eq(modules.id, slug)).run();
}

export function updateModuleConfig(slug: string, config: Record<string, string>): void {
  ensureModule(slug);
  db.update(modules).set({ config: JSON.stringify(config) }).where(eq(modules.id, slug)).run();
}

export function isModuleConfigured(slug: string): boolean {
  const def = MODULE_DEFINITIONS.find((d) => d.slug === slug);
  if (!def || def.configFields.length === 0) return true;
  const record = ensureModule(slug);
  return def.configFields.every((f) => !!record.config[f.key]?.trim());
}
