import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// GET /api/notifications/morning-briefing?user_id=xxx
// Called at 8:30 on working days
export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0];

  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single();

  // Check if working day
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ send: false, reason: 'Weekend' });
  }

  // Check vacation
  const { data: exc } = await supabase
    .from('availability_exceptions')
    .select('id')
    .eq('user_id', userId)
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1);
  if (exc && exc.length > 0) return NextResponse.json({ send: false, reason: 'On leave' });

  // Get assigned tasks sorted by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
  const { data: tasks } = await supabase
    .from('work_items')
    .select('id, title, priority, state, estimated_minutes, actual_minutes, progress_pct, due_date, item_type')
    .eq('assignee_id', userId)
    .not('state', 'in', '(done,cancelled,archived)')
    .order('priority')
    .order('due_date', { ascending: true, nullsFirst: false });

  // Filter out parent tasks (those with children)
  const { data: allItems } = await supabase
    .from('work_items')
    .select('parent_id')
    .not('parent_id', 'is', null);
  const parentIds = new Set((allItems || []).map(i => i.parent_id));
  const actionableTasks = (tasks || []).filter(t => !parentIds.has(t.id));

  // Get capacity for today
  const { data: cap } = await supabase
    .from('capacity_profiles')
    .select('weekly_minutes, allocation_pct')
    .eq('user_id', userId)
    .is('effective_to', null)
    .single();

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayDay = days[new Date().getDay()];
  const dailyMinutes = cap ? Math.round(((cap.weekly_minutes as Record<string, number>)[todayDay] || 0) * cap.allocation_pct / 100) : 480;

  // In progress first
  const inProgress = actionableTasks.filter(t => t.state === 'in_progress');
  const upcoming = actionableTasks.filter(t => t.state !== 'in_progress').slice(0, 10);

  // Build notification
  const notification = {
    send: true,
    type: 'morning_briefing',
    user: user?.full_name || 'Unknown',
    date: today,
    expectedHours: formatMinutes(dailyMinutes),
    title: `Bom dia ${user?.full_name?.split(' ')[0] || ''}! Aqui estão as tuas tarefas para hoje.`,
    inProgress: inProgress.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      estimated: formatMinutes(t.estimated_minutes || 0),
      actual: formatMinutes(t.actual_minutes || 0),
      remaining: formatMinutes(Math.max(0, (t.estimated_minutes || 0) - (t.actual_minutes || 0))),
      progress: `${Number(t.progress_pct || 0).toFixed(0)}%`,
      due: t.due_date,
    })),
    upcoming: upcoming.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      estimated: formatMinutes(t.estimated_minutes || 0),
      actual: formatMinutes(t.actual_minutes || 0),
      progress: `${Number(t.progress_pct || 0).toFixed(0)}%`,
      due: t.due_date,
    })),
    totalTasks: actionableTasks.length,
  };

  // Save to notification_events
  await supabase.from('notification_events').insert({
    user_id: userId,
    event_type: 'time_reminder',
    channel: 'in_app',
    title: notification.title,
    body: `${inProgress.length} em progresso, ${upcoming.length} pendentes. Capacidade: ${formatMinutes(dailyMinutes)}.`,
  });

  return NextResponse.json(notification);
}
