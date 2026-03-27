import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    // Check if user exists in our users table (admin must pre-create)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilizador não registado. Contacta o administrador.' },
        { status: 401 }
      );
    }

    if (!existingUser.is_active) {
      return NextResponse.json({ error: 'Conta desativada.' }, { status: 401 });
    }

    // Send OTP code via Supabase Auth
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ message: 'Código enviado para o teu email' });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
