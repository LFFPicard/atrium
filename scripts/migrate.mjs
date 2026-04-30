import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const url = process.env.DATABASE_URL ?? '/app/data/atrium.db';
const resolvedUrl = resolve(url);

mkdirSync(dirname(resolvedUrl), { recursive: true });

const sqlite = new Database(resolvedUrl);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });
console.log('[atrium] migrations applied');

sqlite.close();
