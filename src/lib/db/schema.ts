import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  plexToken: text('plex_token'),
  jellyfinUserId: text('jellyfin_user_id'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at').notNull(),
});

export const tabs = sqliteTable('tabs', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  icon: text('icon').notNull(),
  order: integer('order').notNull(),
  minRole: text('min_role', { enum: ['admin', 'user'] }).notNull().default('user'),
  openInIframe: integer('open_in_iframe', { mode: 'boolean' }).notNull().default(true),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const modules = sqliteTable('modules', {
  id: text('id').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  config: text('config').notNull().default('{}'),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  mediaType: text('media_type', { enum: ['show', 'movie'] }).notNull(),
  sonarrId: integer('sonarr_id'),
  radarrId: integer('radarr_id'),
  title: text('title').notNull(),
  posterUrl: text('poster_url'),
  notifyEmail: integer('notify_email', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  fromUserId: text('from_user_id').notNull().references(() => users.id),
  toUserId: text('to_user_id').references(() => users.id),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

export const statsCache = sqliteTable('stats_cache', {
  key: text('key').primaryKey(),
  data: text('data').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
