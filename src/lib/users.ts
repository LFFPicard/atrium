import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, messages, subscriptions } from '@/lib/db/schema';

export type UserRow = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  plexToken: string | null;
  jellyfinUserId: string | null;
  avatarUrl: string | null;
  createdAt: number;
  mustChangePassword: boolean;
};

const userColumns = {
  id: users.id,
  username: users.username,
  email: users.email,
  role: users.role,
  plexToken: users.plexToken,
  jellyfinUserId: users.jellyfinUserId,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
  mustChangePassword: users.mustChangePassword,
} as const;

export function getAllUsers(): UserRow[] {
  return db.select(userColumns).from(users).all() as UserRow[];
}

export function getUserById(id: string): UserRow | null {
  return (db.select(userColumns).from(users).where(eq(users.id, id)).get() as UserRow) ?? null;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export function createUser(data: CreateUserData): UserRow {
  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(data.password, 12);
  const createdAt = Math.floor(Date.now() / 1000);

  db.insert(users).values({
    id,
    username: data.username,
    email: data.email,
    passwordHash,
    role: data.role ?? 'user',
    createdAt,
    mustChangePassword: false,
  }).run();

  return getUserById(id)!;
}

export interface UpdateUserData {
  role?: 'admin' | 'user';
  password?: string;
}

export function updateUser(id: string, data: UpdateUserData): void {
  if (data.password !== undefined) {
    const passwordHash = bcrypt.hashSync(data.password, 12);
    db.update(users)
      .set({
        passwordHash,
        mustChangePassword: true,
        ...(data.role !== undefined ? { role: data.role } : {}),
      })
      .where(eq(users.id, id))
      .run();
  } else if (data.role !== undefined) {
    db.update(users)
      .set({ role: data.role })
      .where(eq(users.id, id))
      .run();
  }
}

export function updateUserRole(id: string, role: 'admin' | 'user'): void {
  db.update(users).set({ role }).where(eq(users.id, id)).run();
}

export function deleteUser(id: string): void {
  db.delete(subscriptions).where(eq(subscriptions.userId, id)).run();
  db.delete(messages)
    .where(or(eq(messages.fromUserId, id), eq(messages.toUserId, id)))
    .run();
  db.delete(users).where(eq(users.id, id)).run();
}
