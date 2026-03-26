import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// GET /api/notifications/lunch-summary?user_id=xxx
// Called at 14:30 on working days
export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0];

  const { data: user } = await supabase.from('users').select('full_name').eq('id', userId).single();

  // Get morning time entries
  const { data: entries } = await supabase
    .from('time_entries')
    .select('minutes, work_item_id, description')
    .eq('user_id', userId)
    .eq('date', today);

  const totalMorning = entries?.reduce((s, e) => s + (e.minutes || 0), 0) || 0;

  // Get work items for these entries
  const workItemIds = [...new Set((entries || []).map(e => e.work_item_id).filter(Boolean))];
  let workedOn: { id: string; title: string }[] = [];
  if (workItemIds.length > 0) {
    const { data: items } = await supabase
      .from('work_items')
      .select('id, title')
      .in('id', workItemIds);
    workedOn = items || [];
  }

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
  const halfDay = Math.round(dailyMinutes / 2);
  const morningPct = halfDay > 0 ? Math.round((totalMorning / halfDay) * 100) : 0;

  const notification = {
    send: true,
    type: 'lunch_summary',
    user: user?.full_name || 'Unknown',
    title: `Resumo da manhã - ${user?.full_name?.split(' ')[0] || ''}`,
    morningLogged: formatMinutes(totalMorning),
    morningTarget: formatMinutes(halfDay),
    performance: `${morningPct}%`,
    entriesCount: entries?.length || 0,
    workedOn: workedOn.map(w => ({ id: w.id, title: w.title })),
    remaining: formatMinutes(Math.max(0, dailyMinutes - totalMorning)),
    message: morningPct >= 90
      ? 'Excelente manhã! Mantém o ritmo.'
      : morningPct >= 50
      ? 'Boa manhã. Ainda tens tempo para completar.'
      : 'Manhã lenta. Foca-te nas tarefas prioritárias esta tarde.',
  };

  await supabase.from('notification_events').insert({
    user_id: userId,
    event_type: 'time_reminder',
    channel: 'in_app',
    title: notification.title,
    body: `Manhã: ${formatMinutes(totalMorning)} de ${formatMinutes(halfDay)} (${morningPct}%). ${notification.message}`,
  });

  return NextResponse.json(notification);
}
