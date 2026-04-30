import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getMessage, markAsRead, deleteMessage } from '@/lib/messages';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const msg = getMessage(id);
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isAdmin = session.user.role === 'admin';
  const isRecipient = msg.toUserId === userId || (isAdmin && msg.toUserId === null);
  const isSender = msg.fromUserId === userId;

  if (!isAdmin && !isRecipient && !isSender) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!msg.read && (isRecipient || isAdmin)) {
    markAsRead(id, userId);
  }

  return NextResponse.json({ ...msg, read: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const msg = getMessage(id);
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isAdmin = session.user.role === 'admin';
  const isOwner = msg.fromUserId === userId || msg.toUserId === userId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  deleteMessage(id);
  return new NextResponse(null, { status: 204 });
}
