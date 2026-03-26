import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');

  let query = supabase
    .from('time_entries')
    .select('*, work_item:work_items(id, title, item_type)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (user_id) query = query.eq('user_id', user_id);
  if (date_from) query = query.gte('date', date_from);
  if (date_to) query = query.lte('date', date_to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  // Get admin user id
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  const userId = body.user_id || adminUser?.id;
  if (!userId) return NextResponse.json({ error: 'No user found' }, { status: 400 });

  // Check if work item has subtasks - if so, block time logging
  const { count: childCount } = await supabase
    .from('work_items')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', body.work_item_id);

  if (childCount && childCount > 0) {
    return NextResponse.json(
      { error: 'Não é possível registar tempo em tarefas com subtarefas. Registe tempo nas subtarefas individuais.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      work_item_id: body.work_item_id,
      date: body.date || new Date().toISOString().split('T')[0],
      minutes: body.minutes,
      description: body.description || null,
      status: 'submitted',
      is_billable: true,
    })
    .select('*, work_item:work_items(id, title)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
