import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('availability_exceptions')
    .insert({
      user_id: body.user_id,
      exception_type: body.exception_type,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason || null,
      approved: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
