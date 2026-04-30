import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getAllSettings, setSetting } from '@/lib/settings';

const SENSITIVE_PATTERNS = ['password', 'pass', 'secret', 'api_key', 'token'];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_PATTERNS.some((p) => lower.includes(p));
}

function maskSettings(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    result[k] = isSensitiveKey(k) && v ? '••••••••' : v;
  }
  return result;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(maskSettings(getAllSettings()));
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json() as Record<string, unknown>;
  for (const [key, value] of Object.entries(body)) {
    setSetting(key, value);
  }
  return NextResponse.json({ ok: true });
}
