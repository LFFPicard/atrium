import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getMessagesForUser, sendMessage } from '@/lib/messages';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const msgs = getMessagesForUser(userId, session.user.role);
  return NextResponse.json(msgs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    toUserId?: unknown;
    subject?: unknown;
    body?: unknown;
  };

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const msgBody = typeof body.body === 'string' ? body.body.trim() : '';

  if (!subject) return NextResponse.json({ error: 'Missing subject' }, { status: 400 });
  if (!msgBody) return NextResponse.json({ error: 'Missing body' }, { status: 400 });

  // Users can only send to null (admin inbox); admins can send to any user or null
  let toUserId: string | null = null;
  if (session.user.role === 'admin' && typeof body.toUserId === 'string') {
    toUserId = body.toUserId;
  }

  sendMessage(userId, toUserId, subject, msgBody);
  return new NextResponse(null, { status: 201 });
}
