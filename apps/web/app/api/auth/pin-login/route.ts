import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json({ error: 'Email e PIN obrigatórios' }, { status: 400 });
    }

    if (pin.length !== 8 || !/^\d{8}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN deve ter 8 dígitos' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, pin_hash, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Conta desativada' }, { status: 401 });
    }

    if (!user.pin_hash) {
      return NextResponse.json({ error: 'PIN não configurado. Contacta o administrador.' }, { status: 401 });
    }

    // Verify PIN (plain comparison for MVP, should hash in production)
    if (user.pin_hash !== pin) {
      return NextResponse.json({ error: 'PIN incorreto' }, { status: 401 });
    }

    // Create session cookie with user info
    const sessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Login com sucesso',
      user: { id: user.id, full_name: user.full_name, role: user.role },
    });

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
