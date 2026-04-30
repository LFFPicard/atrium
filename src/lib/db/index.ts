import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

function createDb() {
  const url = process.env.DATABASE_URL ?? '/app/data/atrium.db';
  const sqlite = new Database(url);
  sqlite.pragma('journal_mode = WAL');
  return drizzle(sqlite, { schema });
}

type DrizzleDb = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { db: DrizzleDb | undefined };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
