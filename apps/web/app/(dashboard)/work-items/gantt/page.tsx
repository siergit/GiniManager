import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-blue-500', low: 'bg-cyan-400', none: 'bg-gray-400',
};

const stateOpacity: Record<string, string> = {
  done: 'opacity-50', cancelled: 'opacity-30', archived: 'opacity-20',
  blocked: 'opacity-70', on_hold: 'opacity-60',
};

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

export default async function GanttPage() {
  const supabase = createAdminClient();

  const { data: items } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority, start_date, due_date, actual_start_date, actual_end_date, progress_pct, assignee_id, parent_id, estimated_minutes')
    .not('state', 'in', '(cancelled,archived)')
    .or('start_date.not.is.null,due_date.not.is.null')
    .order('start_date', { ascending: true, nullsFirst: false })
    .order('due_date', { ascending: true, nullsFirst: false });

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_active', true);

  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));
  const allItems = items || [];

  // Calculate timeline range
  const dates = allItems.flatMap(i => [i.start_date, i.due_date, i.actual_start_date, i.actual_end_date].filter(Boolean)) as string[];
  if (dates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gantt Chart</h1>
          <Link href="/work-items" className="text-sm text-blue-600 hover:underline">← Lista</Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-400">
          Sem items com datas definidas. Adiciona start/due dates aos work items para ver o Gantt.
        </div>
      </div>
    );
  }

  const minDate = new Date(Math.min(...dates.map(d => new Date(d + 'T00:00:00').getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => new Date(d + 'T00:00:00').getTime())));

  // Add padding
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 7);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayWidth = 28; // px per day
  const totalWidth = totalDays * dayWidth;

  function getPosition(dateStr: string | null): number {
    if (!dateStr) return 0;
    const d = new Date(dateStr + 'T00:00:00');
    return Math.round(((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth);
  }

  function getBarWidth(start: string | null, end: string | null): number {
    if (!start || !end) return dayWidth;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    return Math.max(dayWidth, Math.round(((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth));
  }

  // Generate month headers
  const months: { label: string; left: number; width: number }[] = [];
  const current = new Date(minDate);
  while (current <= maxDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const startPos = getPosition(monthStart.toISOString().split('T')[0]);
    const endPos = getPosition(monthEnd.toISOString().split('T')[0]);
    months.push({
      label: current.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }),
      left: Math.max(0, startPos),
      width: Math.min(totalWidth - Math.max(0, startPos), endPos - Math.max(0, startPos) + dayWidth),
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Today line
  const todayPos = getPosition(new Date().toISOString().split('T')[0]);

  const typeIcons: Record<string, string> = {
    area: '📁', project: '📋', delivery: '📦', task: '✅', subtask: '◻️',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gantt Chart</h1>
          <p className="mt-1 text-sm text-gray-500">{allItems.length} items com datas · {formatDate(minDate.toISOString().split('T')[0])} — {formatDate(maxDate.toISOString().split('T')[0])}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/work-items" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Lista</Link>
          <Link href="/work-items/kanban" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Kanban</Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex">
          {/* Left panel: item names */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200">
            <div className="h-10 border-b border-gray-200 bg-gray-50 px-3 flex items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Item</span>
            </div>
            {allItems.map((item, i) => (
              <div key={item.id} className={`h-10 border-b border-gray-50 px-3 flex items-center gap-2 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <span className="text-xs">{typeIcons[item.item_type] || '·'}</span>
                <Link href={`/work-items/${item.id}`} className="text-xs text-gray-900 truncate hover:text-blue-600 flex-1">
                  {item.title}
                </Link>
              </div>
            ))}
          </div>

          {/* Right panel: timeline */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: totalWidth, minWidth: '100%' }} className="relative">
              {/* Month headers */}
              <div className="h-10 border-b border-gray-200 bg-gray-50 relative">
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 h-full flex items-center border-r border-gray-200" style={{ left: m.left, width: m.width }}>
                    <span className="px-2 text-xs font-medium text-gray-500 capitalize">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Today line */}
              {todayPos >= 0 && todayPos <= totalWidth && (
                <div className="absolute top-0 bottom-0 w-px bg-red-400 z-20" style={{ left: todayPos }}>
                  <div className="absolute -top-0 -left-2 bg-red-500 text-white text-[8px] px-1 rounded-b">Hoje</div>
                </div>
              )}

              {/* Bars */}
              {allItems.map((item, i) => {
                const startDate = item.actual_start_date || item.start_date;
                const endDate = item.actual_end_date || item.due_date;
                const left = getPosition(startDate);
                const width = getBarWidth(startDate, endDate);
                const progress = item.progress_pct || 0;

                return (
                  <div key={item.id} className={`h-10 border-b border-gray-50 relative ${i % 2 === 0 ? '' : 'bg-gray-50/30'} ${stateOpacity[item.state] || ''}`}>
                    {/* Bar */}
                    <div
                      className="absolute top-2 h-6 rounded group cursor-pointer"
                      style={{ left, width: Math.max(width, 4) }}
                    >
                      {/* Background */}
                      <div className={`absolute inset-0 rounded ${priorityColors[item.priority] || 'bg-gray-400'} opacity-20`} />
                      {/* Progress fill */}
                      <div
                        className={`absolute top-0 left-0 h-full rounded ${priorityColors[item.priority] || 'bg-gray-400'}`}
                        style={{ width: `${progress}%` }}
                      />
                      {/* Label */}
                      {width > 60 && (
                        <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium text-white truncate z-10">
                          {item.title}
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 z-30 bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                        {item.title} · {Math.round(progress)}%
                        {startDate && ` · ${formatDate(startDate)}`}
                        {endDate && ` — ${formatDate(endDate)}`}
                        {item.assignee_id && ` · ${userMap[item.assignee_id] || ''}`}
                      </div>
                    </div>

                    {/* Milestone diamond */}
                    {!endDate && startDate && (
                      <div
                        className={`absolute top-3 h-4 w-4 rotate-45 ${priorityColors[item.priority] || 'bg-gray-400'}`}
                        style={{ left: left - 2 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500" /> Crítica</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-orange-500" /> Alta</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-500" /> Média</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-cyan-400" /> Baixa</span>
        <span className="flex items-center gap-1"><span className="h-1 w-6 bg-red-400" /> Hoje</span>
        <span className="text-gray-400">Barra = progresso preenchido</span>
      </div>
    </div>
  );
}
