import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  if (!body.full_name || !body.email || !body.pin) {
    return NextResponse.json({ error: 'Nome, email e PIN obrigatórios' }, { status: 400 });
  }

  if (body.pin.length !== 8 || !/^\d{8}$/.test(body.pin)) {
    return NextResponse.json({ error: 'PIN deve ter 8 dígitos numéricos' }, { status: 400 });
  }

  // Check if email exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', body.email.toLowerCase())
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Email já existe' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: crypto.randomUUID(),
      email: body.email.toLowerCase().trim(),
      full_name: body.full_name.trim(),
      role: body.role || 'collaborator',
      pin_hash: body.pin,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  if (!body.user_id) {
    return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if ('pin' in body) {
    if (body.pin.length !== 8 || !/^\d{8}$/.test(body.pin)) {
      return NextResponse.json({ error: 'PIN deve ter 8 dígitos' }, { status: 400 });
    }
    updates.pin_hash = body.pin;
  }
  if ('is_active' in body) updates.is_active = body.is_active;
  if ('role' in body) updates.role = body.role;
  if ('full_name' in body) updates.full_name = body.full_name;

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', body.user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
