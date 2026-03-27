import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

// GET /api/timer?user_id=xxx - Get active timer for a user
export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  // Get active timer (is_timer=true, timer_stopped_at IS NULL)
  let query = supabase
    .from('time_entries')
    .select('*, work_item:work_items(id, title, item_type)')
    .eq('is_timer', true)
    .is('timer_stopped_at', null);

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ timer: data });
}

// POST /api/timer - Start a timer
export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  const userId = body.user_id;
  const workItemId = body.work_item_id;

  if (!userId || !workItemId) {
    return NextResponse.json({ error: 'user_id and work_item_id required' }, { status: 400 });
  }

  // Check if work item has subtasks (blocked)
  const { count: childCount } = await supabase
    .from('work_items')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', workItemId);

  if (childCount && childCount > 0) {
    return NextResponse.json(
      { error: 'Não podes iniciar timer em tarefas com subtarefas. Inicia nas subtarefas.' },
      { status: 400 }
    );
  }

  // Stop any existing timer for this user first
  const { data: existing } = await supabase
    .from('time_entries')
    .select('id, timer_started_at')
    .eq('user_id', userId)
    .eq('is_timer', true)
    .is('timer_stopped_at', null)
    .maybeSingle();

  if (existing) {
    const started = new Date(existing.timer_started_at);
    const minutes = Math.max(1, Math.round((Date.now() - started.getTime()) / 60000));
    await supabase
      .from('time_entries')
      .update({
        timer_stopped_at: new Date().toISOString(),
        minutes,
        status: 'submitted',
      })
      .eq('id', existing.id);
  }

  // Start new timer
  const now = new Date();
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      work_item_id: workItemId,
      date: now.toISOString().split('T')[0],
      minutes: 0,
      is_timer: true,
      timer_started_at: now.toISOString(),
      status: 'draft',
    })
    .select('*, work_item:work_items(id, title)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto set work item to in_progress if backlog/ready/planned
  await supabase
    .from('work_items')
    .update({ state: 'in_progress' })
    .eq('id', workItemId)
    .in('state', ['backlog', 'ready', 'planned']);

  return NextResponse.json({ timer: data }, { status: 201 });
}

// DELETE /api/timer - Stop the active timer
export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const description = searchParams.get('description') || null;

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const { data: timer } = await supabase
    .from('time_entries')
    .select('id, timer_started_at, work_item_id')
    .eq('user_id', userId)
    .eq('is_timer', true)
    .is('timer_stopped_at', null)
    .maybeSingle();

  if (!timer) return NextResponse.json({ error: 'No active timer' }, { status: 404 });

  const started = new Date(timer.timer_started_at);
  const now = new Date();
  const minutes = Math.max(1, Math.round((now.getTime() - started.getTime()) / 60000));

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      timer_stopped_at: now.toISOString(),
      minutes,
      status: 'submitted',
      description,
    })
    .eq('id', timer.id)
    .select('*, work_item:work_items(id, title)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data, minutes });
}
