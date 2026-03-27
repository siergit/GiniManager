import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();

    const response = NextResponse.json({ message: 'Session set' });

    // Set Supabase session cookie
    response.cookies.set('sb-session-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
