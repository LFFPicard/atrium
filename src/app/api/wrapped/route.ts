import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { findTautulliUserId } from '@/lib/modules/tautulli';
import { getWrappedData } from '@/lib/wrapped';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const currentYear = new Date().getFullYear();
  const year = yearParam ? parseInt(yearParam, 10) : currentYear;

  if (isNaN(year) || year < 2010 || year > currentYear) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  const isAdmin = session.user.role === 'admin';
  let tautulliUserId: number | null = null;
  if (!isAdmin) {
    tautulliUserId = await findTautulliUserId(session.user.username);
  }

  const summary = await getWrappedData(userId, year, tautulliUserId);
  if (!summary) {
    return NextResponse.json({ error: 'No data available' }, { status: 404 });
  }

  return NextResponse.json(summary);
}
