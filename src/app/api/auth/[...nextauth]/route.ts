import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/lib/auth/config';
import { checkRateLimit } from '@/lib/auth/rate-limit';

export const { GET } = handlers;

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0]?.trim() : 'unknown';

  // 10 login attempts per IP per 15 minutes
  if (!checkRateLimit(`login:${ip ?? 'unknown'}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 },
    );
  }

  return handlers.POST(req);
}
