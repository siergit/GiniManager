import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();

  // Check OTP session
  const sessionCookie = cookieStore.get('gini-session');
  if (sessionCookie?.value) {
    try {
      const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      return NextResponse.json({ user: decoded });
    } catch {
      // fall through
    }
  }

  // Check admin session
  const adminCookie = cookieStore.get('gini-admin-session');
  if (adminCookie?.value === 'admin') {
    return NextResponse.json({
      user: {
        userId: '00000000-0000-0000-0000-000000000001',
        email: 'admin@sier.pt',
        fullName: 'Admin SIER',
        role: 'admin',
      },
    });
  }

  return NextResponse.json({ user: null }, { status: 401 });
}
