import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';

export type SubscriptionRow = InferSelectModel<typeof subscriptions>;

export function getUserSubscriptions(userId: string): SubscriptionRow[] {
  return db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).all();
}

export interface AddSubscriptionData {
  mediaType: 'show' | 'movie';
  sonarrId?: number | null;
  radarrId?: number | null;
  title: string;
  posterUrl?: string | null;
  notifyEmail?: boolean;
}

export function addSubscription(userId: string, data: AddSubscriptionData): SubscriptionRow {
  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  db.insert(subscriptions)
    .values({
      id,
      userId,
      mediaType: data.mediaType,
      sonarrId: data.sonarrId ?? null,
      radarrId: data.radarrId ?? null,
      title: data.title,
      posterUrl: data.posterUrl ?? null,
      notifyEmail: data.notifyEmail ?? false,
      createdAt: now,
    })
    .run();
  return db.select().from(subscriptions).where(eq(subscriptions.id, id)).get()!;
}

export function removeSubscription(
  userId: string,
  mediaId: number,
  mediaType: 'show' | 'movie',
): void {
  if (mediaType === 'show') {
    db.delete(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.sonarrId, mediaId),
          eq(subscriptions.mediaType, 'show'),
        ),
      )
      .run();
  } else {
    db.delete(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.radarrId, mediaId),
          eq(subscriptions.mediaType, 'movie'),
        ),
      )
      .run();
  }
}

export function isSubscribed(
  userId: string,
  mediaId: number,
  mediaType: 'show' | 'movie',
): boolean {
  if (mediaType === 'show') {
    return !!db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.sonarrId, mediaId),
          eq(subscriptions.mediaType, 'show'),
        ),
      )
      .get();
  }
  return !!db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.radarrId, mediaId),
        eq(subscriptions.mediaType, 'movie'),
      ),
    )
    .get();
}
