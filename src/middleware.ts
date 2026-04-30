import { auth } from '@/lib/auth/edge-config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  if (!isAuthenticated && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons).*)'],
};
