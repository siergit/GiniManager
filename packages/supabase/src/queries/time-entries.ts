import type { SupabaseClient } from '@supabase/supabase-js';

export async function listTimeEntries(
  supabase: SupabaseClient,
  filters: {
    user_id?: string;
    work_item_id?: string;
    date_from?: string;
    date_to?: string;
    status?: string[];
  } = {},
) {
  let query = supabase
    .from('time_entries')
    .select('*, work_item:work_items(id, title)', { count: 'exact' });

  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.work_item_id) query = query.eq('work_item_id', filters.work_item_id);
  if (filters.date_from) query = query.gte('date', filters.date_from);
  if (filters.date_to) query = query.lte('date', filters.date_to);
  if (filters.status?.length) query = query.in('status', filters.status);

  return query.order('date', { ascending: false });
}

export async function startTimer(
  supabase: SupabaseClient,
  userId: string,
  workItemId: string,
) {
  return supabase.from('time_entries').insert({
    user_id: userId,
    work_item_id: workItemId,
    date: new Date().toISOString().split('T')[0],
    minutes: 0,
    is_timer: true,
    timer_started_at: new Date().toISOString(),
    status: 'draft',
  }).select().single();
}

export async function stopTimer(
  supabase: SupabaseClient,
  userId: string,
) {
  const now = new Date();
  const { data: timer } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('is_timer', true)
    .is('timer_stopped_at', null)
    .single();

  if (!timer) return { data: null, error: { message: 'No active timer' } };

  const startedAt = new Date(timer.timer_started_at);
  const minutes = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60000));

  return supabase
    .from('time_entries')
    .update({
      timer_stopped_at: now.toISOString(),
      minutes,
      status: 'submitted',
    })
    .eq('id', timer.id)
    .select()
    .single();
}
