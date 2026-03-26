import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const { data: items } = await supabase
    .from('work_items')
    .select('state, priority, item_type');

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('is_active', true)
    .order('full_name');

  // Recent activity (last 10 state changes + comments + time entries)
  const { data: recentStateChanges } = await supabase
    .from('work_item_state_log')
    .select('*, work_item:work_items!work_item_state_log_work_item_id_fkey(id, title), user:users!work_item_state_log_changed_by_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentComments } = await supabase
    .from('comments')
    .select('*, work_item:work_items!comments_work_item_id_fkey(id, title), user:users!comments_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentTimeEntries } = await supabase
    .from('time_entries')
    .select('*, work_item:work_items(id, title), user:users!time_entries_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Merge and sort
  type Activity = { type: string; title: string; detail: string; time: string; link?: string };
  const activities: Activity[] = [];

  recentStateChanges?.forEach(s => {
    activities.push({
      type: '🔄',
      title: `${s.user?.full_name || 'Someone'} changed state`,
      detail: `${s.work_item?.title || 'Item'}: ${s.from_state || '?'} → ${s.to_state}`,
      time: s.created_at,
      link: s.work_item?.id ? `/work-items/${s.work_item.id}` : undefined,
    });
  });

  recentComments?.forEach(c => {
    activities.push({
      type: '💬',
      title: `${c.user?.full_name || 'Someone'} commented`,
      detail: `on ${c.work_item?.title || 'Item'}: "${c.body?.substring(0, 50)}${c.body?.length > 50 ? '...' : ''}"`,
      time: c.created_at,
      link: c.work_item?.id ? `/work-items/${c.work_item.id}` : undefined,
    });
  });

  recentTimeEntries?.forEach(t => {
    const h = Math.floor(t.minutes / 60);
    const m = t.minutes % 60;
    const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
    activities.push({
      type: '⏱️',
      title: `${t.user?.full_name || 'Someone'} logged ${dur}`,
      detail: `on ${t.work_item?.title || 'Item'}`,
      time: t.created_at,
      link: t.work_item?.id ? `/work-items/${t.work_item.id}` : undefined,
    });
  });

  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const topActivities = activities.slice(0, 10);

  const total = items?.length || 0;
  const inProgress = items?.filter(i => i.state === 'in_progress').length || 0;
  const blocked = items?.filter(i => i.state === 'blocked').length || 0;
  const done = items?.filter(i => i.state === 'done').length || 0;
  const backlog = items?.filter(i => i.state === 'backlog').length || 0;

  const stats = [
    { label: 'Total Work Items', value: total.toString(), detail: `${items?.filter(i => i.item_type === 'task').length || 0} tasks` },
    { label: 'In Progress', value: inProgress.toString(), detail: `${backlog} in backlog` },
    { label: 'Blocked', value: blocked.toString(), detail: blocked === 0 ? 'No blockers' : 'Needs attention' },
    { label: 'Done', value: done.toString(), detail: `${total > 0 ? Math.round(done / total * 100) : 0}% complete` },
  ];

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    collaborator: 'Collaborator',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Management overview - live data from Supabase</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {topActivities.length > 0 ? topActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{act.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{act.title}</p>
                  {act.link ? (
                    <a href={act.link} className="text-xs text-blue-600 hover:underline truncate block">{act.detail}</a>
                  ) : (
                    <p className="text-xs text-gray-500 truncate">{act.detail}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(act.time).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-400">No recent activity. Start by changing states, logging time, or adding comments.</p>
            )}
          </div>
        </div>

        {/* Team */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Team ({users?.length || 0})</h2>
          <div className="mt-4 space-y-3">
            {users?.filter(u => u.email !== 'admin@sier.pt').map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {member.full_name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.full_name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                  {roleLabels[member.role] || member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/work-items/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            + New Work Item
          </a>
          <a href="/work-items" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            View All Items
          </a>
          <a href="/time-tracking" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Time Tracking
          </a>
        </div>
      </div>
    </div>
  );
}
