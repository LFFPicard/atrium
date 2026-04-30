import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getAllUsers, createUser, type UserRow } from '@/lib/users';

function stripSensitive(user: UserRow) {
  const { plexToken: _pt, jellyfinUserId: _ju, ...safe } = user;
  return safe;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  if (session.user.role !== 'admin') return { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  return { denied: null, session };
}

export async function GET() {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(getAllUsers().map(stripSensitive));
}

export async function POST(req: NextRequest) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const body = await req.json() as {
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'user';
  };

  if (!body.username?.trim() || !body.email?.trim() || !body.password?.trim()) {
    return NextResponse.json({ error: 'username, email and password are required' }, { status: 400 });
  }

  try {
    const user = createUser({
      username: body.username.trim(),
      email: body.email.trim(),
      password: body.password,
      role: body.role,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }
    throw err;
  }
}
