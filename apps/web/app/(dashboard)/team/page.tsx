import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

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
    .order('role')
    .order('full_name');

  // Get work item counts per user
  const { data: assignments } = await supabase
    .from('work_items')
    .select('assignee_id, state')
    .not('assignee_id', 'is', null);

  // Get time entries this week per user
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('user_id, minutes')
    .gte('date', weekAgo.toISOString().split('T')[0]);

  const { data: capacities } = await supabase
    .from('capacity_profiles')
    .select('user_id, capacity_type, allocation_pct, weekly_minutes')
    .is('effective_to', null);

  const capacityMap: Record<string, { type: string; allocation: number; weeklyHours: number }> = {};
  capacities?.forEach(c => {
    const weeklyMin = Object.values(c.weekly_minutes as Record<string, number>).reduce((s, v) => s + v, 0);
    capacityMap[c.user_id] = {
      type: c.capacity_type,
      allocation: c.allocation_pct,
      weeklyHours: Math.round((weeklyMin * c.allocation_pct / 100) / 60),
    };
  });

  const userStats: Record<string, { assigned: number; inProgress: number; done: number; weekMinutes: number }> = {};
  assignments?.forEach(a => {
    if (!a.assignee_id) return;
    if (!userStats[a.assignee_id]) userStats[a.assignee_id] = { assigned: 0, inProgress: 0, done: 0, weekMinutes: 0 };
    userStats[a.assignee_id].assigned++;
    if (a.state === 'in_progress') userStats[a.assignee_id].inProgress++;
    if (a.state === 'done') userStats[a.assignee_id].done++;
  });
  timeEntries?.forEach(t => {
    if (!userStats[t.user_id]) userStats[t.user_id] = { assigned: 0, inProgress: 0, done: 0, weekMinutes: 0 };
    userStats[t.user_id].weekMinutes += t.minutes || 0;
  });

  function formatMinutes(min: number): string {
    if (min === 0) return '0h';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="mt-1 text-sm text-gray-500">{users?.length || 0} members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.filter(u => u.email !== 'admin@sier.pt').map(user => {
          const stats = userStats[user.id] || { assigned: 0, inProgress: 0, done: 0, weekMinutes: 0 };
          return (
            <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">
                  {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{user.full_name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role] || ''}`}>
                  {user.role}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-900">{stats.assigned}</p>
                  <p className="text-xs text-gray-500">Assigned</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-2">
                  <p className="text-lg font-bold text-yellow-700">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-lg font-bold text-green-700">{stats.done}</p>
                  <p className="text-xs text-gray-500">Done</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2">
                  <p className="text-lg font-bold text-blue-700">{formatMinutes(stats.weekMinutes)}</p>
                  <p className="text-xs text-gray-500">Week</p>
                </div>
              </div>

              {capacityMap[user.id] && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className={`rounded px-1.5 py-0.5 font-medium ${capacityMap[user.id].type === 'full_time' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {capacityMap[user.id].type === 'full_time' ? 'Full-time' : 'Part-time'}
                  </span>
                  <span>{capacityMap[user.id].allocation}% allocation</span>
                  <span>·</span>
                  <span>{capacityMap[user.id].weeklyHours}h/week capacity</span>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-400">
                <span>Timezone: {user.timezone}</span>
                <span className="mx-2">·</span>
                <span>Joined: {new Date(user.created_at).toLocaleDateString('pt-PT')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
