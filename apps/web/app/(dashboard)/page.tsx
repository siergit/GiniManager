import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const { data: items } = await supabase
    .from('work_items')
    .select('id, title, state, priority, item_type, due_date, assignee_id, parent_id');

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

  // Overdue and upcoming deadlines
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const overdueItems = items?.filter(i =>
    i.due_date && i.due_date < today && !['done', 'cancelled', 'archived'].includes(i.state)
  ) || [];

  const upcomingItems = items?.filter(i =>
    i.due_date && i.due_date >= today && i.due_date <= nextWeekStr && !['done', 'cancelled', 'archived'].includes(i.state)
  ) || [];

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

      {/* Overdue & Upcoming Deadlines */}
      {(overdueItems.length > 0 || upcomingItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {overdueItems.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-800">🔴 Overdue ({overdueItems.length})</h3>
              <div className="mt-2 space-y-1.5">
                {overdueItems.slice(0, 5).map(item => (
                  <a key={item.id} href={`/work-items/${item.id}`} className="flex items-center justify-between text-sm hover:bg-red-100 rounded px-2 py-1 -mx-2">
                    <span className="text-red-900 truncate">{item.title}</span>
                    <span className="text-xs text-red-600 whitespace-nowrap ml-2">
                      due {new Date(item.due_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
          {upcomingItems.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-800">⚠️ Due This Week ({upcomingItems.length})</h3>
              <div className="mt-2 space-y-1.5">
                {upcomingItems.slice(0, 5).map(item => (
                  <a key={item.id} href={`/work-items/${item.id}`} className="flex items-center justify-between text-sm hover:bg-amber-100 rounded px-2 py-1 -mx-2">
                    <span className="text-amber-900 truncate">{item.title}</span>
                    <span className="text-xs text-amber-600 whitespace-nowrap ml-2">
                      due {new Date(item.due_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Area Progress Overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Progresso por Área</h2>
        <div className="mt-4 space-y-4">
          {(items || []).filter(i => i.item_type === 'area').map(area => {
            // Get all descendants of this area
            function getDescendants(parentId: string): typeof items {
              const direct = (items || []).filter(i => i.parent_id === parentId);
              let all = [...direct];
              direct.forEach(d => { all = all.concat(getDescendants(d.id) || []); });
              return all;
            }

            const descendants = getDescendants(area.id) || [];
            const total = descendants.length;
            const done = descendants.filter(d => d.state === 'done').length;
            const inProg = descendants.filter(d => d.state === 'in_progress').length;
            const blocked = descendants.filter(d => ['blocked', 'on_hold'].includes(d.state)).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div key={area.id}>
                <div className="flex items-center justify-between mb-1">
                  <a href={`/work-items/${area.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">{area.title}</a>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="text-green-600">{done} done</span>
                    <span className="text-yellow-600">{inProg} active</span>
                    {blocked > 0 && <span className="text-red-600">{blocked} blocked</span>}
                    <span className="font-medium text-gray-900">{pct}%</span>
                  </div>
                </div>
                <div className="h-4 rounded-full bg-gray-100 overflow-hidden flex">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                  <div className="h-full bg-yellow-400 transition-all" style={{ width: `${total > 0 ? (inProg / total) * 100 : 0}%` }} />
                  <div className="h-full bg-red-400 transition-all" style={{ width: `${total > 0 ? (blocked / total) * 100 : 0}%` }} />
                </div>
                <div className="mt-0.5 text-[10px] text-gray-400">{total} items total</div>
              </div>
            );
          })}
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
