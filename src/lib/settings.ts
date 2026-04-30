import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export function getSetting<T = unknown>(key: string): T | null {
  try {
    const row = db.select().from(settings).where(eq(settings.key, key)).get();
    if (!row) return null;
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export function setSetting(key: string, value: unknown): void {
  const encoded = JSON.stringify(value);
  db.insert(settings)
    .values({ key, value: encoded })
    .onConflictDoUpdate({ target: settings.key, set: { value: encoded } })
    .run();
}

export function getSettings(keys: string[]): Record<string, unknown> {
  if (keys.length === 0) return {};
  const rows = db.select().from(settings).all();
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    if (keys.includes(row.key)) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = null;
      }
    }
  }
  return result;
}

export function getAllSettings(): Record<string, unknown> {
  const rows = db.select().from(settings).all();
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = null;
    }
  }
  return result;
}
