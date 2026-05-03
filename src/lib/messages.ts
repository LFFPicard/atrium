import { randomUUID } from 'crypto';
import { and, count, desc, eq, inArray, isNull, ne, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { messages, users } from '@/lib/db/schema';

export interface MessageWithUsers {
  id: string;
  fromUserId: string;
  toUserId: string | null;
  subject: string;
  body: string;
  read: boolean;
  createdAt: number;
  fromUsername: string;
  fromRole: string;
  toUsername: string | null;
}

function attachUsers(
  rows: Array<{
    id: string;
    fromUserId: string;
    toUserId: string | null;
    subject: string;
    body: string;
    read: boolean;
    createdAt: number;
  }>,
): MessageWithUsers[] {
  if (rows.length === 0) return [];

  const ids = [
    ...new Set(rows.flatMap((m) => [m.fromUserId, m.toUserId].filter(Boolean) as string[])),
  ];

  const userRows = db
    .select({ id: users.id, username: users.username, role: users.role })
    .from(users)
    .where(inArray(users.id, ids))
    .all();

  const userMap = new Map(userRows.map((u) => [u.id, u]));

  return rows.map((m) => ({
    id: m.id,
    fromUserId: m.fromUserId,
    toUserId: m.toUserId,
    subject: m.subject,
    body: m.body,
    read: m.read,
    createdAt: m.createdAt,
    fromUsername: userMap.get(m.fromUserId)?.username ?? 'Unknown',
    fromRole: userMap.get(m.fromUserId)?.role ?? 'user',
    toUsername: m.toUserId ? (userMap.get(m.toUserId)?.username ?? null) : null,
  }));
}

export function getMessagesForUser(userId: string, role: string): MessageWithUsers[] {
  const rows =
    role === 'admin'
      ? db.select().from(messages).orderBy(desc(messages.createdAt)).all()
      : db
          .select()
          .from(messages)
          .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
          .orderBy(desc(messages.createdAt))
          .all();

  return attachUsers(rows);
}

export function getMessage(id: string): MessageWithUsers | null {
  const row = db.select().from(messages).where(eq(messages.id, id)).get();
  if (!row) return null;
  return attachUsers([row])[0] ?? null;
}

export function sendMessage(
  fromUserId: string,
  toUserId: string | null,
  subject: string,
  body: string,
): void {
  db.insert(messages)
    .values({
      id: randomUUID(),
      fromUserId,
      toUserId,
      subject,
      body,
      read: false,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
}

export function markAsRead(id: string): void {
  db.update(messages).set({ read: true }).where(eq(messages.id, id)).run();
}

export function deleteMessage(id: string): void {
  db.delete(messages).where(eq(messages.id, id)).run();
}

export function getUnreadMessages(userId: string, role: string, limit = 3): MessageWithUsers[] {
  const condition =
    role === 'admin'
      ? and(
          or(isNull(messages.toUserId), eq(messages.toUserId, userId)),
          eq(messages.read, false),
          ne(messages.fromUserId, userId),
        )
      : and(eq(messages.toUserId, userId), eq(messages.read, false));

  const rows = db
    .select()
    .from(messages)
    .where(condition)
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .all();

  return attachUsers(rows);
}

export function getUnreadCount(userId: string, role: string): number {
  const condition =
    role === 'admin'
      ? and(
          or(isNull(messages.toUserId), eq(messages.toUserId, userId)),
          eq(messages.read, false),
          ne(messages.fromUserId, userId),
        )
      : and(eq(messages.toUserId, userId), eq(messages.read, false));

  const result = db.select({ count: count() }).from(messages).where(condition).get();
  return result?.count ?? 0;
}
