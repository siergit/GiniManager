import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email e código obrigatórios' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Verify the OTP code with Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: code,
      type: 'email',
    });

    if (error) {
      return NextResponse.json({ error: 'Código inválido ou expirado. Tenta novamente.' }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ error: 'Sessão não criada' }, { status: 500 });
    }

    // Get user info from our users table
    const { data: userInfo } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('email', email.toLowerCase().trim())
      .single();

    const sessionData = JSON.stringify({
      userId: userInfo?.id || data.user?.id,
      email: email.toLowerCase().trim(),
      fullName: userInfo?.full_name || email.split('@')[0],
      role: userInfo?.role || 'collaborator',
      supabaseToken: data.session.access_token,
    });

    const response = NextResponse.json({
      message: 'Login com sucesso',
      user: { full_name: userInfo?.full_name, role: userInfo?.role },
    });

    // Set session cookie
    response.cookies.set('gini-session', Buffer.from(sessionData).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
