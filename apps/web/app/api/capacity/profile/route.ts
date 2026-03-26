import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  // Upsert: update existing or create new
  const { data: existing } = await supabase
    .from('capacity_profiles')
    .select('id')
    .eq('user_id', body.user_id)
    .is('effective_to', null)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('capacity_profiles')
      .update({
        weekly_minutes: body.weekly_minutes,
        allocation_pct: body.allocation_pct,
      })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('capacity_profiles')
      .insert({
        user_id: body.user_id,
        weekly_minutes: body.weekly_minutes,
        allocation_pct: body.allocation_pct,
        effective_from: new Date().toISOString().split('T')[0],
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
