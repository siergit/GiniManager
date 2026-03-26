import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/notifications/reminder?user_id=xxx
// Called by a cron/edge function every 15 min during work hours
// Returns suggested tasks for a user who hasn't logged time recently
export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Check if user has logged time in the last 15 minutes
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: recentEntries } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .gte('created_at', fifteenMinAgo)
    .limit(1);

  if (recentEntries && recentEntries.length > 0) {
    return NextResponse.json({ reminder: false, message: 'User has recent time entries' });
  }

  // Check if today is a working day (not weekend, not holiday, not vacation)
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ reminder: false, message: 'Weekend' });
  }

  // Check for vacation/exception
  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('id')
    .eq('user_id', userId)
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1);

  if (exceptions && exceptions.length > 0) {
    return NextResponse.json({ reminder: false, message: 'User is on leave' });
  }

  // Get suggested tasks (assigned to user, in_progress first, then by priority)
  const { data: suggestedTasks } = await supabase
    .from('work_items')
    .select('id, title, priority, state, estimated_minutes, actual_minutes')
    .eq('assignee_id', userId)
    .not('state', 'in', '(done,cancelled,archived)')
    .order('state')  // in_progress first
    .order('priority')
    .limit(5);

  // Check total time today
  const { data: todayTotal } = await supabase
    .from('time_entries')
    .select('minutes')
    .eq('user_id', userId)
    .eq('date', today);

  const totalMinutes = todayTotal?.reduce((s, e) => s + (e.minutes || 0), 0) || 0;

  return NextResponse.json({
    reminder: true,
    totalToday: totalMinutes,
    expectedMinutes: 480,
    gap: 480 - totalMinutes,
    suggestedTasks: suggestedTasks || [],
    message: `Tens ${480 - totalMinutes} minutos por registar hoje. Abre uma das tarefas sugeridas.`,
  });
}
