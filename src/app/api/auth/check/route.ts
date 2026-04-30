import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

// nginx auth_request endpoint — returns 200 for valid sessions, 401 otherwise.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }
  return new NextResponse(null, { status: 200 });
}
