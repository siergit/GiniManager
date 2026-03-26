import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import ExportCSV from './export-csv';

export const dynamic = 'force-dynamic';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default async function ReportsPage() {
  const supabase = createAdminClient();

  // Get all work items
  const { data: items } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority, estimated_minutes, actual_minutes, deviation_pct, assignee_id, parent_id, created_at, actual_end_date');

  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_active', true);

  // Get time entries (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('user_id, work_item_id, minutes, date')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

  const allItems = items || [];
  const allEntries = timeEntries || [];
  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));

  // Summary stats
  const totalTimeLogged = allEntries.reduce((s, e) => s + (e.minutes || 0), 0);
  const itemsDone = allItems.filter(i => i.state === 'done').length;
  const totalEstimated = allItems.reduce((s, i) => s + (i.estimated_minutes || 0), 0);
  const totalActual = allItems.reduce((s, i) => s + (i.actual_minutes || 0), 0);

  // Time by user
  const timeByUser: Record<string, number> = {};
  allEntries.forEach(e => {
    const name = userMap[e.user_id] || 'Unknown';
    timeByUser[name] = (timeByUser[name] || 0) + (e.minutes || 0);
  });
  const maxUserTime = Math.max(...Object.values(timeByUser), 1);

  // Items by state
  const byState: Record<string, number> = {};
  allItems.forEach(i => { byState[i.state] = (byState[i.state] || 0) + 1; });
  const stateOrder = ['backlog', 'ready', 'planned', 'in_progress', 'in_review', 'blocked', 'on_hold', 'done', 'cancelled'];

  // Items by type
  const byType: Record<string, number> = {};
  allItems.forEach(i => { byType[i.item_type] = (byType[i.item_type] || 0) + 1; });

  // Top deviations (actual > estimated, sorted by deviation)
  const deviations = allItems
    .filter(i => i.estimated_minutes > 0 && i.actual_minutes > i.estimated_minutes)
    .map(i => ({
      ...i,
      deviationPct: Math.round(((i.actual_minutes - i.estimated_minutes) / i.estimated_minutes) * 100),
    }))
    .sort((a, b) => b.deviationPct - a.deviationPct)
    .slice(0, 10);

  // Time by area (top-level parent)
  const areas = allItems.filter(i => i.item_type === 'area');
  function getAreaId(itemId: string): string | null {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return null;
    if (item.item_type === 'area') return item.id;
    if (item.parent_id) return getAreaId(item.parent_id);
    return null;
  }
  const timeByArea: Record<string, number> = {};
  allEntries.forEach(e => {
    const areaId = getAreaId(e.work_item_id);
    if (areaId) {
      const area = areas.find(a => a.id === areaId);
      const name = area?.title || 'Other';
      timeByArea[name] = (timeByArea[name] || 0) + (e.minutes || 0);
    }
  });
  const maxAreaTime = Math.max(...Object.values(timeByArea), 1);

  const stateColors: Record<string, string> = {
    backlog: 'bg-gray-300', ready: 'bg-blue-400', planned: 'bg-purple-400',
    in_progress: 'bg-yellow-400', in_review: 'bg-indigo-400', blocked: 'bg-red-400',
    on_hold: 'bg-gray-400', done: 'bg-green-400', cancelled: 'bg-gray-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Last 30 days overview</p>
        <div className="mt-2 flex items-center gap-3">
          <Link href="/reports/weekly" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            Ver relatório semanal →
          </Link>
          <ExportCSV endpoint="/api/work-items?limit=500" filename="work-items" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Time Logged</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatMinutes(totalTimeLogged)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Items Done</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{itemsDone}</p>
          <p className="text-xs text-gray-400">of {allItems.length} total</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Estimated</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatMinutes(totalEstimated)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Actual</p>
          <p className={`mt-1 text-2xl font-bold ${totalActual > totalEstimated ? 'text-red-600' : 'text-green-700'}`}>
            {formatMinutes(totalActual)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time by User */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Time by User</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(timeByUser).sort((a, b) => b[1] - a[1]).map(([name, mins]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{name}</span>
                  <span className="font-medium text-gray-900">{formatMinutes(mins)}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${(mins / maxUserTime) * 100}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(timeByUser).length === 0 && (
              <p className="text-sm text-gray-400">No time entries yet</p>
            )}
          </div>
        </div>

        {/* Time by Area */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Time by Area</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(timeByArea).sort((a, b) => b[1] - a[1]).map(([name, mins]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{name}</span>
                  <span className="font-medium text-gray-900">{formatMinutes(mins)}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${(mins / maxAreaTime) * 100}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(timeByArea).length === 0 && (
              <p className="text-sm text-gray-400">No time entries yet</p>
            )}
          </div>
        </div>

        {/* Items by State */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Items by State</h2>
          <div className="mt-4 space-y-2">
            {stateOrder.filter(s => byState[s]).map(state => (
              <div key={state} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${stateColors[state] || 'bg-gray-300'}`} />
                <span className="text-sm text-gray-700 w-28 capitalize">{state.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${stateColors[state] || 'bg-gray-300'}`} style={{ width: `${(byState[state] / allItems.length) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{byState[state]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Items by Type */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Items by Type</h2>
          <div className="mt-4 space-y-2">
            {['area', 'project', 'delivery', 'task', 'subtask'].filter(t => byType[t]).map(type => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-20 capitalize">{type}</span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(byType[type] / allItems.length) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{byType[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deviations Table */}
      {deviations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Top Deviations (Over Budget)</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium w-20 text-right">Estimated</th>
                <th className="px-4 py-2 font-medium w-20 text-right">Actual</th>
                <th className="px-4 py-2 font-medium w-24 text-right">Deviation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deviations.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <a href={`/work-items/${item.id}`} className="text-blue-600 hover:underline">{item.title}</a>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{formatMinutes(item.estimated_minutes)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{formatMinutes(item.actual_minutes)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-red-600">+{item.deviationPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
