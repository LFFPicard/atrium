import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getUnreadCount } from '@/lib/messages';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const count = getUnreadCount(userId, session.user.role);
  return NextResponse.json({ count });
}
