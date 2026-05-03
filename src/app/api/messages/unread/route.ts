import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getUnreadMessages, getUnreadCount } from '@/lib/messages';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = getUnreadMessages(userId, session.user.role, 3);
  const total = getUnreadCount(userId, session.user.role);
  return NextResponse.json({ messages: items, total });
}
