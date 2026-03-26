const stats = [
  { label: 'Total Work Items', value: '0', change: 'No data yet', color: 'blue' },
  { label: 'In Progress', value: '0', change: 'No active items', color: 'yellow' },
  { label: 'Blocked', value: '0', change: 'No blockers', color: 'red' },
  { label: 'Done This Week', value: '0', change: 'No completions', color: 'green' },
];

const recentActivity = [
  { action: 'System initialized', detail: 'GiniManager project created', time: 'Just now' },
  { action: 'Database ready', detail: '21 tables with RLS policies', time: 'Just now' },
  { action: 'ClickUp data mapped', detail: '5 team members, 3 areas, ~300 tasks', time: 'Pending import' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="mt-4 space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Overview */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: 'Daniel Viana', role: 'SW/Electronics', email: 'daniel.viana@sier.pt' },
              { name: 'Rafael Ribeiro', role: 'CNC/Mechanics', email: 'rafael.ribeiro@sier.pt' },
              { name: 'Miguel Reis', role: 'Software', email: 'miguel.reis@sier.pt' },
              { name: 'Andre Barbosa', role: 'CAD/Design Lead', email: 'andre.barbosa@sier.pt' },
              { name: 'Pedro Moreira', role: 'Electronics/HW', email: 'pedro.moreira@sier.pt' },
            ].map((member) => (
              <div key={member.email} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/work-items/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + New Work Item
          </a>
          <a
            href="/work-items"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View All Items
          </a>
          <a
            href="/time-tracking"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Time Tracking
          </a>
        </div>
      </div>
    </div>
  );
}
