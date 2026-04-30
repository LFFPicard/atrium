import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const url = process.env.DATABASE_URL ?? '/app/data/atrium.db';
const resolvedUrl = resolve(url);

mkdirSync(dirname(resolvedUrl), { recursive: true });

if (!existsSync(resolvedUrl)) {
  console.log('[atrium] seed: database does not exist yet, skipping seed');
  process.exit(0);
}

const sqlite = new Database(resolvedUrl);
sqlite.pragma('journal_mode = WAL');

const { count } = sqlite.prepare('SELECT COUNT(*) as count FROM users').get();

if (count === 0) {
  const passwordHash = bcrypt.hashSync('atrium', 12);
  sqlite.prepare(`
    INSERT INTO users (id, username, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), 'admin', 'admin@atrium.local', passwordHash, 'admin', Math.floor(Date.now() / 1000));

  console.log('[atrium] ----------------------------------------');
  console.log('[atrium] Default admin account created:');
  console.log('[atrium]   username : admin');
  console.log('[atrium]   password : atrium');
  console.log('[atrium] Change this password immediately!');
  console.log('[atrium] ----------------------------------------');
} else {
  console.log('[atrium] seed: users already exist, skipping');
}

sqlite.close();
