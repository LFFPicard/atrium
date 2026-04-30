import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getUserById, updateUser, deleteUser, type UserRow } from '@/lib/users';

function stripSensitive({ plexToken, jellyfinUserId, ...safe }: UserRow) {
  void plexToken; void jellyfinUserId;
  return safe;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  if (session.user.role !== 'admin') return { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  return { denied: null, session };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { denied, session } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { role?: 'admin' | 'user'; password?: string };

  if (body.role === 'user' && id === session!.user.id) {
    return NextResponse.json({ error: 'Cannot demote your own account' }, { status: 403 });
  }

  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  updateUser(id, { role: body.role, password: body.password });

  const updated = getUserById(id);
  return NextResponse.json(updated ? stripSensitive(updated) : null);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { denied, session } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  if (id === session!.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
  }

  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  deleteUser(id);

  return NextResponse.json({ ok: true });
}
