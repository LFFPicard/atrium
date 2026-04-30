import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

function createDb() {
  const url = process.env.DATABASE_URL ?? '/app/data/atrium.db';
  try {
    const sqlite = new Database(url);
    sqlite.pragma('journal_mode = WAL');
    return drizzle(sqlite, { schema });
  } catch (err) {
    throw new Error(
      `Cannot open database at "${url}". Ensure the data directory is mounted and DATABASE_URL is correct. (${err instanceof Error ? err.message : String(err)})`,
    );
  }
}

type DrizzleDb = ReturnType<typeof createDb>;

let _instance: DrizzleDb | undefined;

function getInstance(): DrizzleDb {
  if (!_instance) _instance = createDb();
  return _instance;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const instance = getInstance();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
