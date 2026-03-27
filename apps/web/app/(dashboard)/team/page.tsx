import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  collaborator: 'bg-gray-100 text-gray-700',
};

export default async function TeamPage() {
  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt')
    .order('full_name');

  // Work items per user
  const { data: allItems } = await supabase
    .from('work_items')
    .select('assignee_id, state, due_date, estimated_minutes, actual_minutes');

  const today = new Date().toISOString().split('T')[0];

  // Time entries this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const { data: weekEntries } = await supabase
    .from('time_entries')
    .select('user_id, minutes')
    .gte('date', weekStart.toISOString().split('T')[0]);

  // Today's entries
  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('user_id, minutes')
    .eq('date', today);

  // Capacity
  const { data: capacities } = await supabase
    .from('capacity_profiles')
    .select('user_id, capacity_type, allocation_pct, weekly_minutes')
    .is('effective_to', null);

  const capMap: Record<string, { type: string; alloc: number; weeklyH: number }> = {};
  capacities?.forEach(c => {
    const weekMin = Object.values(c.weekly_minutes as Record<string, number>).reduce((s, v) => s + v, 0);
    capMap[c.user_id] = {
      type: c.capacity_type,
      alloc: c.allocation_pct,
      weeklyH: Math.round((weekMin * c.allocation_pct / 100) / 60),
    };
  });

  // Build per-user performance data
  const performanceData = (users || []).map(user => {
    const items = (allItems || []).filter(i => i.assignee_id === user.id);
    const active = items.filter(i => !['done', 'cancelled', 'archived'].includes(i.state));
    const inProgress = active.filter(i => i.state === 'in_progress').length;
    const blocked = active.filter(i => i.state === 'blocked' || i.state === 'on_hold').length;
    const overdue = active.filter(i => i.due_date && i.due_date < today).length;
    const done = items.filter(i => i.state === 'done').length;
    const totalEst = active.reduce((s, i) => s + (i.estimated_minutes || 0), 0);
    const totalAct = active.reduce((s, i) => s + (i.actual_minutes || 0), 0);

    const weekMin = (weekEntries || []).filter(e => e.user_id === user.id).reduce((s, e) => s + (e.minutes || 0), 0);
    const todayMin = (todayEntries || []).filter(e => e.user_id === user.id).reduce((s, e) => s + (e.minutes || 0), 0);

    const cap = capMap[user.id];
    const expectedWeek = (cap?.weeklyH || 40) * 60;
    const weekPct = expectedWeek > 0 ? Math.round((weekMin / expectedWeek) * 100) : 0;
    const todayPct = Math.round((todayMin / 480) * 100);

    // Risk score: overdue + blocked + low utilization
    let risk = 0;
    if (overdue > 0) risk += 2;
    if (blocked > 0) risk += 1;
    if (weekPct < 50) risk += 1;
    const riskLevel = risk >= 3 ? 'high' : risk >= 1 ? 'medium' : 'low';

    return {
      ...user,
      inProgress, blocked, overdue, done,
      totalActive: active.length,
      totalEst, totalAct,
      weekMin, todayMin,
      weekPct, todayPct,
      cap,
      riskLevel,
    };
  });

  // Sort: high risk first
  const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  performanceData.sort((a, b) => (riskOrder[a.riskLevel] || 2) - (riskOrder[b.riskLevel] || 2));

  const riskColors: Record<string, string> = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-green-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel de Equipa</h1>
        <p className="mt-1 text-sm text-gray-500">Performance e carga de trabalho - quem precisa de ajuda?</p>
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Membros ativos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{users?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Com atrasos</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{performanceData.filter(u => u.overdue > 0).length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Bloqueados</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{performanceData.filter(u => u.blocked > 0).length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Horas esta semana</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatMinutes(performanceData.reduce((s, u) => s + u.weekMin, 0))}</p>
        </div>
      </div>

      {/* Per Person Performance Cards */}
      <div className="space-y-3">
        {performanceData.map(user => (
          <div key={user.id} className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden border-l-4 ${riskColors[user.riskLevel] || ''}`}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                  {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{user.full_name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${roleColors[user.role] || ''}`}>{user.role}</span>
                    {user.riskLevel === 'high' && <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-medium">Precisa de ajuda</span>}
                  </div>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* Performance Grid */}
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-900">{user.totalActive}</p>
                  <p className="text-[10px] text-gray-500">Pendentes</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-2">
                  <p className="text-lg font-bold text-yellow-700">{user.inProgress}</p>
                  <p className="text-[10px] text-gray-500">Ativas</p>
                </div>
                <div className={`rounded-lg p-2 ${user.overdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className={`text-lg font-bold ${user.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{user.overdue}</p>
                  <p className="text-[10px] text-gray-500">Atrasadas</p>
                </div>
                <div className={`rounded-lg p-2 ${user.blocked > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <p className={`text-lg font-bold ${user.blocked > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{user.blocked}</p>
                  <p className="text-[10px] text-gray-500">Bloqueadas</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-lg font-bold text-green-700">{user.done}</p>
                  <p className="text-[10px] text-gray-500">Concluídas</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2">
                  <p className="text-lg font-bold text-blue-700">{formatMinutes(user.todayMin)}</p>
                  <p className="text-[10px] text-gray-500">Hoje</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-2">
                  <p className="text-lg font-bold text-indigo-700">{formatMinutes(user.weekMin)}</p>
                  <p className="text-[10px] text-gray-500">Semana</p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Hoje ({user.todayPct}%)</span>
                    <span>{formatMinutes(user.todayMin)} / 8h</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full rounded-full ${user.todayPct >= 90 ? 'bg-green-500' : user.todayPct >= 50 ? 'bg-blue-500' : 'bg-red-400'}`} style={{ width: `${Math.min(100, user.todayPct)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Semana ({user.weekPct}%)</span>
                    <span>{formatMinutes(user.weekMin)} / {user.cap ? `${user.cap.weeklyH}h` : '40h'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full rounded-full ${user.weekPct >= 90 ? 'bg-green-500' : user.weekPct >= 50 ? 'bg-blue-500' : 'bg-red-400'}`} style={{ width: `${Math.min(100, user.weekPct)}%` }} />
                  </div>
                </div>
              </div>

              {/* Capacity */}
              {user.cap && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                  <span className={`rounded px-1.5 py-0.5 font-medium ${user.cap.type === 'full_time' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {user.cap.type === 'full_time' ? 'Full-time' : 'Part-time'}
                  </span>
                  <span>{user.cap.alloc}% alocação</span>
                  <span>·</span>
                  <span>{user.cap.weeklyH}h/semana</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
