import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  ready: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-indigo-100 text-indigo-700',
  blocked: 'bg-red-100 text-red-700',
  on_hold: 'bg-gray-200 text-gray-600',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const typeLabels: Record<string, string> = {
  area: 'Area', project: 'Project', delivery: 'Delivery', task: 'Task', subtask: 'Subtask',
};

const typeColors: Record<string, string> = {
  area: 'bg-indigo-600', project: 'bg-blue-600', delivery: 'bg-cyan-600', task: 'bg-emerald-600', subtask: 'bg-gray-500',
};

function formatMinutes(min: number): string {
  if (min === 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h${m}m`;
}

function progressColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 25) return 'bg-yellow-500';
  return 'bg-red-400';
}

export default async function WorkItemsPage() {
  const supabase = createAdminClient();

  // Get ALL work items with a single query for efficiency
  const { data: allItems } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority, parent_id, depth, estimated_minutes, actual_minutes, progress_pct, assignee_id, start_date, due_date')
    .order('sort_order')
    .order('created_at');

  const items = allItems || [];

  // Build hierarchy
  const areas = items.filter(i => i.item_type === 'area' && !i.parent_id);
  const totalsByType: Record<string, number> = {};
  items.forEach(i => { totalsByType[i.item_type] = (totalsByType[i.item_type] || 0) + 1; });

  function getChildren(parentId: string) {
    return items.filter(i => i.parent_id === parentId);
  }

  function getDescendantStats(parentId: string): { total: number; done: number; estMin: number; actMin: number } {
    const children = getChildren(parentId);
    let total = children.length;
    let done = children.filter(c => c.state === 'done').length;
    let estMin = children.reduce((s, c) => s + (c.estimated_minutes || 0), 0);
    let actMin = children.reduce((s, c) => s + (c.actual_minutes || 0), 0);
    children.forEach(c => {
      const sub = getDescendantStats(c.id);
      total += sub.total;
      done += sub.done;
      estMin += sub.estMin;
      actMin += sub.actMin;
    });
    return { total, done, estMin, actMin };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Items</h1>
          <p className="mt-1 text-sm text-gray-500">
            {items.length} items total — {totalsByType['area'] || 0} areas, {totalsByType['project'] || 0} projects, {totalsByType['delivery'] || 0} deliveries, {totalsByType['task'] || 0} tasks
          </p>
        </div>
        <Link href="/work-items/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + New Item
        </Link>
      </div>

      <div className="space-y-4">
        {areas.map((area) => {
          const areaChildren = getChildren(area.id);
          const areaStats = getDescendantStats(area.id);
          const areaPct = areaStats.total > 0 ? Math.round((areaStats.done / areaStats.total) * 100) : 0;

          return (
            <div key={area.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Area Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <span className="text-lg">{priorityIcons[area.priority] || '⚪'}</span>
                <Link href={`/work-items/${area.id}`} className="text-base font-semibold text-gray-900 hover:text-blue-600">
                  {area.title}
                </Link>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateColors[area.state] || 'bg-gray-100 text-gray-700'}`}>
                  {area.state.replace(/_/g, ' ')}
                </span>
                <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                  <span>{areaStats.total} items</span>
                  <span>{areaStats.done} done</span>
                  <span>Est: {formatMinutes(areaStats.estMin)}</span>
                  <span>Act: {formatMinutes(areaStats.actMin)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full rounded-full ${progressColor(areaPct)}`} style={{ width: `${areaPct}%` }} />
                    </div>
                    <span className="font-medium">{areaPct}%</span>
                  </div>
                </div>
              </div>

              {/* Children rows */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                      <th className="pl-10 pr-4 py-2 font-medium">Title</th>
                      <th className="px-2 py-2 font-medium w-20">Type</th>
                      <th className="px-2 py-2 font-medium w-24">State</th>
                      <th className="px-2 py-2 font-medium w-8">Pri</th>
                      <th className="px-2 py-2 font-medium w-20 text-right">Children</th>
                      <th className="px-2 py-2 font-medium w-24 text-right">Progress</th>
                      <th className="px-2 py-2 font-medium w-16 text-right">Est.</th>
                      <th className="px-2 py-2 font-medium w-16 text-right">Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {areaChildren.map((child) => {
                      const stats = getDescendantStats(child.id);
                      const directChildren = getChildren(child.id);
                      const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : Number(child.progress_pct || 0);

                      return (
                        <tr key={child.id} className="hover:bg-blue-50 transition-colors">
                          <td className="pl-10 pr-4 py-2.5">
                            <Link href={`/work-items/${child.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                              {child.title}
                            </Link>
                          </td>
                          <td className="px-2 py-2.5">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium text-white ${typeColors[child.item_type] || 'bg-gray-500'}`}>
                              {typeLabels[child.item_type]}
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[child.state] || 'bg-gray-100 text-gray-700'}`}>
                              {child.state.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center">{priorityIcons[child.priority] || '⚪'}</td>
                          <td className="px-2 py-2.5 text-right text-xs text-gray-500">
                            {directChildren.length > 0 ? `${stats.done}/${stats.total}` : '—'}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-1.5 justify-end">
                              <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-right text-xs text-gray-500">
                            {formatMinutes((child.estimated_minutes || 0) + stats.estMin)}
                          </td>
                          <td className="px-2 py-2.5 text-right text-xs text-gray-500">
                            {formatMinutes((child.actual_minutes || 0) + stats.actMin)}
                          </td>
                        </tr>
                      );
                    })}
                    {areaChildren.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">No child items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
