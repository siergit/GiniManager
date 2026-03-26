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
        {/* Items by Type */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Items by Type</h2>
          <div className="mt-4 space-y-3">
            {['area', 'project', 'delivery', 'task', 'subtask'].map((type) => {
              const count = items?.filter(i => i.item_type === type).length || 0;
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
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
