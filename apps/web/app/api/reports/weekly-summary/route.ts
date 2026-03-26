import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// GET /api/reports/weekly-summary?week_start=2026-03-23
export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  // Default to current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const weekStart = searchParams.get('week_start') || monday.toISOString().split('T')[0];
  const weekEnd = new Date(new Date(weekStart).getTime() + 4 * 86400000).toISOString().split('T')[0]; // Friday

  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt');

  // Get time entries for the week
  const { data: entries } = await supabase
    .from('time_entries')
    .select('user_id, minutes, date, work_item_id, status')
    .gte('date', weekStart)
    .lte('date', weekEnd);

  // Get state changes this week
  const { data: stateChanges } = await supabase
    .from('work_item_state_log')
    .select('to_state, changed_by, work_item_id')
    .gte('created_at', weekStart + 'T00:00:00')
    .lte('created_at', weekEnd + 'T23:59:59');

  // Per-user breakdown
  const userSummaries = (users || []).map(user => {
    const userEntries = (entries || []).filter(e => e.user_id === user.id);
    const totalMinutes = userEntries.reduce((s, e) => s + (e.minutes || 0), 0);
    const uniqueDays = new Set(userEntries.map(e => e.date)).size;
    const uniqueTasks = new Set(userEntries.map(e => e.work_item_id)).size;

    const userChanges = (stateChanges || []).filter(s => s.changed_by === user.id);
    const completed = userChanges.filter(s => s.to_state === 'done').length;
    const started = userChanges.filter(s => s.to_state === 'in_progress').length;

    // Daily breakdown
    const dailyMinutes: Record<string, number> = {};
    userEntries.forEach(e => {
      dailyMinutes[e.date] = (dailyMinutes[e.date] || 0) + (e.minutes || 0);
    });

    const expectedDaily = 480; // 8h
    const expectedWeek = expectedDaily * 5;
    const performance = expectedWeek > 0 ? Math.round((totalMinutes / expectedWeek) * 100) : 0;

    return {
      userId: user.id,
      name: user.full_name,
      totalMinutes,
      totalFormatted: formatMinutes(totalMinutes),
      expectedMinutes: expectedWeek,
      performance,
      daysWorked: uniqueDays,
      tasksWorkedOn: uniqueTasks,
      tasksCompleted: completed,
      tasksStarted: started,
      dailyMinutes,
    };
  });

  // Team totals
  const teamTotal = userSummaries.reduce((s, u) => s + u.totalMinutes, 0);
  const teamCompleted = userSummaries.reduce((s, u) => s + u.tasksCompleted, 0);
  const teamStarted = userSummaries.reduce((s, u) => s + u.tasksStarted, 0);
  const teamExpected = userSummaries.length * 5 * 480;
  const teamPerformance = teamExpected > 0 ? Math.round((teamTotal / teamExpected) * 100) : 0;

  return NextResponse.json({
    weekStart,
    weekEnd,
    team: {
      totalMinutes: teamTotal,
      totalFormatted: formatMinutes(teamTotal),
      performance: teamPerformance,
      tasksCompleted: teamCompleted,
      tasksStarted: teamStarted,
    },
    users: userSummaries,
  });
}
