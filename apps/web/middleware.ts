import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/verify-otp', '/forgot-password', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and API health
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Check for admin session cookie
  const adminSession = request.cookies.get('gini-admin-session');
  if (adminSession?.value === 'admin') {
    return NextResponse.next();
  }

  // Check for Supabase auth session cookie
  const supabaseAuth = request.cookies.get('sb-regmnsqlanryicspccnn-auth-token');
  if (supabaseAuth) {
    return NextResponse.next();
  }

  // Not authenticated - redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
