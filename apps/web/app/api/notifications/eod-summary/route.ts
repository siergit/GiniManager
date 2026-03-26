import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// GET /api/notifications/eod-summary?user_id=xxx
// Called at 18:00 on working days
export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0];

  const { data: user } = await supabase.from('users').select('full_name').eq('id', userId).single();

  // Get all time entries for today
  const { data: entries } = await supabase
    .from('time_entries')
    .select('minutes, work_item_id, description')
    .eq('user_id', userId)
    .eq('date', today);

  const totalMinutes = entries?.reduce((s, e) => s + (e.minutes || 0), 0) || 0;

  // Get work items
  const workItemIds = [...new Set((entries || []).map(e => e.work_item_id).filter(Boolean))];
  let workedOn: { id: string; title: string; state: string }[] = [];
  if (workItemIds.length > 0) {
    const { data: items } = await supabase
      .from('work_items')
      .select('id, title, state')
      .in('id', workItemIds);
    workedOn = items || [];
  }

  // Get state changes today
  const { data: stateChanges } = await supabase
    .from('work_item_state_log')
    .select('to_state, work_item:work_items!work_item_state_log_work_item_id_fkey(title)')
    .eq('changed_by', userId)
    .gte('created_at', today + 'T00:00:00');

  const completed = stateChanges?.filter(s => s.to_state === 'done').length || 0;

  // Get capacity
  const { data: cap } = await supabase
    .from('capacity_profiles')
    .select('weekly_minutes, allocation_pct')
    .eq('user_id', userId)
    .is('effective_to', null)
    .single();

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayDay = days[new Date().getDay()];
  const dailyMinutes = cap ? Math.round(((cap.weekly_minutes as Record<string, number>)[todayDay] || 0) * cap.allocation_pct / 100) : 480;
  const performancePct = dailyMinutes > 0 ? Math.round((totalMinutes / dailyMinutes) * 100) : 0;

  const notification = {
    send: true,
    type: 'eod_summary',
    user: user?.full_name || 'Unknown',
    title: `Resumo do dia - ${user?.full_name?.split(' ')[0] || ''}`,
    totalLogged: formatMinutes(totalMinutes),
    dailyTarget: formatMinutes(dailyMinutes),
    performance: `${performancePct}%`,
    entriesCount: entries?.length || 0,
    tasksWorkedOn: workedOn.length,
    tasksCompleted: completed,
    workedOn: workedOn.map(w => ({ id: w.id, title: w.title, state: w.state })),
    gap: totalMinutes < dailyMinutes ? formatMinutes(dailyMinutes - totalMinutes) : null,
    overtime: totalMinutes > dailyMinutes ? formatMinutes(totalMinutes - dailyMinutes) : null,
    message: performancePct >= 100
      ? `Dia completo! ${completed > 0 ? `${completed} tarefa(s) concluída(s).` : ''} Bom trabalho!`
      : performancePct >= 80
      ? `Quase lá! Faltam ${formatMinutes(dailyMinutes - totalMinutes)}.`
      : performancePct >= 50
      ? `Dia abaixo do esperado. ${formatMinutes(dailyMinutes - totalMinutes)} por registar.`
      : `Poucas horas registadas. Verifica se tens entradas em falta.`,
  };

  // Save notification and daily summary
  await supabase.from('notification_events').insert({
    user_id: userId,
    event_type: 'time_reminder',
    channel: 'in_app',
    title: notification.title,
    body: `Hoje: ${formatMinutes(totalMinutes)} de ${formatMinutes(dailyMinutes)} (${performancePct}%). ${notification.message}`,
  });

  // Upsert daily summary
  await supabase.from('daily_summaries').upsert({
    user_id: userId,
    summary_date: today,
    total_minutes_logged: totalMinutes,
    expected_minutes: dailyMinutes,
    entries: (entries || []).map(e => ({
      work_item_id: e.work_item_id,
      minutes: e.minutes,
      description: e.description,
    })),
    is_complete: totalMinutes >= dailyMinutes,
    has_gap: totalMinutes < dailyMinutes,
    gap_minutes: Math.max(0, dailyMinutes - totalMinutes),
  }, { onConflict: 'user_id,summary_date' });

  return NextResponse.json(notification);
}
