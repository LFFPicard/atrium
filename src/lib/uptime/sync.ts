import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { uptimeChecks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { MODULE_DEFINITIONS } from '@/lib/modules';

const MODULE_URL_KEYS: Record<string, string> = {
  tautulli: 'tautulli_url',
  sonarr: 'sonarr_url',
  radarr: 'radarr_url',
  jellyfin: 'jellyfin_url',
  overseerr: 'overseerr_url',
};

export function syncModuleUptimeCheck(
  slug: string,
  enabled: boolean,
  config: Record<string, string>,
): void {
  const urlKey = MODULE_URL_KEYS[slug];
  if (!urlKey) return;

  const existing = db.select().from(uptimeChecks).where(eq(uptimeChecks.moduleSlug, slug)).get();

  if (!enabled) {
    if (existing) {
      db.update(uptimeChecks).set({ enabled: false }).where(eq(uptimeChecks.moduleSlug, slug)).run();
    }
    return;
  }

  const url = config[urlKey];
  if (!url) return;

  if (!existing) {
    const def = MODULE_DEFINITIONS.find((d) => d.slug === slug);
    db.insert(uptimeChecks).values({
      id: randomUUID(),
      serviceName: def?.name ?? (slug.charAt(0).toUpperCase() + slug.slice(1)),
      serviceType: 'module',
      moduleSlug: slug,
      url,
      enabled: true,
      intervalMinutes: 15,
      consecutiveFailures: 0,
      lastStatus: 'unknown',
      lastCheckedAt: null,
      lastNotifiedAt: null,
      notifyEmail: false,
      notifyWebhook: false,
      public: true,
    }).run();
  } else {
    db.update(uptimeChecks).set({ enabled: true, url }).where(eq(uptimeChecks.moduleSlug, slug)).run();
  }
}
