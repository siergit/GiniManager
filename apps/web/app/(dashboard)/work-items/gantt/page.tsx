import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const priorityColors: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', none: '#9ca3af',
};

const stateBarColors: Record<string, string> = {
  backlog: '#d1d5db', ready: '#93c5fd', planned: '#c4b5fd', in_progress: '#fbbf24',
  in_review: '#818cf8', blocked: '#f87171', on_hold: '#9ca3af', done: '#4ade80',
  cancelled: '#e5e7eb',
};

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

function daysBetween(start: string, end: string): number {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

export default async function GanttPage() {
  const supabase = createAdminClient();

  const { data: items } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority, start_date, due_date, progress_pct, assignee_id, parent_id, estimated_minutes')
    .not('state', 'in', '(cancelled,archived)')
    .order('sort_order')
    .order('created_at');

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_active', true);

  const { data: deps } = await supabase
    .from('work_item_dependencies')
    .select('work_item_id, depends_on_work_item_id, dependency_type, status')
    .not('depends_on_work_item_id', 'is', null);

  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));
  const allItems = items || [];
  const allDeps = deps || [];

  // Timeline range: find earliest start and latest due date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Default range: 3 months from today
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 14); // 2 weeks back
  const rangeEnd = new Date(today);
  rangeEnd.setDate(rangeEnd.getDate() + 76); // ~2.5 months forward

  const startStr = rangeStart.toISOString().split('T')[0];
  const endStr = rangeEnd.toISOString().split('T')[0];
  const totalDays = daysBetween(startStr, endStr);

  // Generate week markers
  const weeks: { date: string; label: string; offset: number }[] = [];
  const cursor = new Date(rangeStart);
  // Align to Monday
  cursor.setDate(cursor.getDate() + ((8 - cursor.getDay()) % 7));
  while (cursor <= rangeEnd) {
    const dateStr = cursor.toISOString().split('T')[0];
    weeks.push({
      date: dateStr,
      label: formatDate(dateStr),
      offset: daysBetween(startStr, dateStr),
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  // Today offset
  const todayOffset = daysBetween(startStr, todayStr);

  // Filter items that have dates (for Gantt display)
  // Also show items without dates but in_progress
  const ganttItems = allItems.filter(i =>
    (i.start_date && i.due_date) ||
    (i.start_date) ||
    (i.due_date) ||
    i.state === 'in_progress'
  ).filter(i => ['task', 'delivery', 'subtask'].includes(i.item_type));

  // For items with only one date, create a 1-day bar
  function getBar(item: typeof ganttItems[0]) {
    const start = item.start_date || item.due_date || todayStr;
    const end = item.due_date || item.start_date || todayStr;
    const startOffset = daysBetween(startStr, start);
    const duration = daysBetween(start, end);
    const leftPct = (startOffset / totalDays) * 100;
    const widthPct = Math.max(0.5, (duration / totalDays) * 100);
    return { leftPct, widthPct, start, end, duration };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gantt</h1>
          <p className="mt-1 text-sm text-gray-500">
            {ganttItems.length} items com datas · {formatDate(startStr)} — {formatDate(endStr)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/work-items" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Lista
          </Link>
          <Link href="/work-items/kanban" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Kanban
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(stateBarColors).slice(0, 6).map(([state, color]) => (
          <div key={state} className="flex items-center gap-1">
            <div className="h-3 w-6 rounded" style={{ backgroundColor: color }} />
            <span className="text-gray-600 capitalize">{state.replace(/_/g, ' ')}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="h-full w-0.5 bg-red-500" style={{ height: 12 }} />
          <span className="text-gray-600">Hoje</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: '1200px' }}>
            {/* Header with weeks */}
            <div className="flex border-b border-gray-200 bg-gray-50 relative" style={{ height: 36 }}>
              <div className="w-64 flex-shrink-0 px-3 py-2 text-xs font-medium text-gray-500 border-r border-gray-200">
                Item
              </div>
              <div className="flex-1 relative">
                {weeks.map(w => (
                  <div
                    key={w.date}
                    className="absolute top-0 text-[10px] text-gray-400 border-l border-gray-200 pl-1 py-2"
                    style={{ left: `${(w.offset / totalDays) * 100}%` }}
                  >
                    {w.label}
                  </div>
                ))}
                {/* Today line in header */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                />
              </div>
            </div>

            {/* Rows */}
            {ganttItems.map((item) => {
              const bar = getBar(item);
              const progress = Number(item.progress_pct || 0);
              const barColor = stateBarColors[item.state] || '#d1d5db';
              const isOverdue = item.due_date && item.due_date < todayStr && item.state !== 'done';

              return (
                <div key={item.id} className="flex border-b border-gray-50 hover:bg-gray-50 group" style={{ height: 32 }}>
                  {/* Item name */}
                  <div className="w-64 flex-shrink-0 px-3 py-1 border-r border-gray-100 flex items-center gap-1.5 overflow-hidden">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: priorityColors[item.priority] || '#9ca3af' }}
                    />
                    <Link
                      href={`/work-items/${item.id}`}
                      className="text-xs text-gray-800 truncate hover:text-blue-600"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 relative">
                    {/* Today line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-300 z-10"
                      style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                    />

                    {/* Bar */}
                    <div
                      className={`absolute top-1 rounded-sm overflow-hidden ${isOverdue ? 'ring-1 ring-red-400' : ''}`}
                      style={{
                        left: `${bar.leftPct}%`,
                        width: `${bar.widthPct}%`,
                        height: 22,
                      }}
                      title={`${item.title}\n${formatDate(bar.start)} — ${formatDate(bar.end)}\nProgress: ${progress}%\n${item.assignee_id ? userMap[item.assignee_id] : 'Unassigned'}`}
                    >
                      {/* Background */}
                      <div
                        className="absolute inset-0 opacity-30 rounded-sm"
                        style={{ backgroundColor: barColor }}
                      />
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm"
                        style={{ width: `${progress}%`, backgroundColor: barColor }}
                      />
                      {/* Label */}
                      <div className="relative px-1 py-0.5 text-[9px] text-gray-800 font-medium truncate leading-tight">
                        {bar.widthPct > 5 ? item.title : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {ganttItems.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Sem items com datas definidas. Adiciona datas de inicio e fim aos work items para ve-los no Gantt.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dependencies List */}
      {allDeps.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Dependencias ({allDeps.length})</h3>
          <div className="mt-2 space-y-1">
            {allDeps.slice(0, 10).map((dep, i) => {
              const source = allItems.find(it => it.id === dep.work_item_id);
              const target = allItems.find(it => it.id === dep.depends_on_work_item_id);
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="truncate max-w-[200px]">{source?.title || '?'}</span>
                  <span className="text-gray-300">{'\u2192'}</span>
                  <span className="truncate max-w-[200px]">{target?.title || '?'}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    dep.status === 'satisfied' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{dep.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
