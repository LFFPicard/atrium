import { randomUUID } from 'crypto';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tabs } from '@/lib/db/schema';

export type TabRow = {
  id: string;
  slug: string;
  label: string;
  url: string;
  icon: string;
  order: number;
  minRole: 'admin' | 'user';
  openInIframe: boolean;
  enabled: boolean;
};

function generateSlug(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return base || 'tab';
}

export function getAllTabs(): TabRow[] {
  return db.select().from(tabs).orderBy(asc(tabs.order)).all() as TabRow[];
}

export function getTabBySlug(slug: string): TabRow | null {
  return (db.select().from(tabs).where(eq(tabs.slug, slug)).get() as TabRow) ?? null;
}

export interface CreateTabData {
  label: string;
  url: string;
  icon?: string;
  minRole?: 'admin' | 'user';
  openInIframe?: boolean;
  enabled?: boolean;
}

export function createTab(data: CreateTabData): TabRow {
  const id = randomUUID();

  let slug = generateSlug(data.label);
  let counter = 1;
  while (getTabBySlug(slug)) {
    slug = `${generateSlug(data.label)}-${counter}`;
    counter++;
  }

  const existing = getAllTabs();
  const order = existing.length > 0 ? Math.max(...existing.map((t) => t.order)) + 1 : 0;

  db.insert(tabs).values({
    id,
    slug,
    label: data.label,
    url: data.url,
    icon: data.icon ?? '',
    order,
    minRole: data.minRole ?? 'user',
    openInIframe: data.openInIframe ?? true,
    enabled: data.enabled ?? true,
  }).run();

  return getTabBySlug(slug)!;
}

export interface UpdateTabData {
  label?: string;
  url?: string;
  icon?: string;
  minRole?: 'admin' | 'user';
  openInIframe?: boolean;
  enabled?: boolean;
}

export function updateTab(id: string, data: UpdateTabData): void {
  const { label, url, icon, minRole, openInIframe, enabled } = data;
  const setter: Record<string, unknown> = {};
  if (label !== undefined) setter.label = label;
  if (url !== undefined) setter.url = url;
  if (icon !== undefined) setter.icon = icon;
  if (minRole !== undefined) setter.minRole = minRole;
  if (openInIframe !== undefined) setter.openInIframe = openInIframe;
  if (enabled !== undefined) setter.enabled = enabled;
  if (Object.keys(setter).length === 0) return;
  // Drizzle update accepts column keys matching the schema property names
  db.update(tabs).set(setter as Parameters<ReturnType<typeof db.update<typeof tabs>>['set']>[0]).where(eq(tabs.id, id)).run();
}

export function deleteTab(id: string): void {
  db.delete(tabs).where(eq(tabs.id, id)).run();
}

export function reorderTabs(ids: string[]): void {
  for (let i = 0; i < ids.length; i++) {
    db.update(tabs).set({ order: i }).where(eq(tabs.id, ids[i])).run();
  }
}
