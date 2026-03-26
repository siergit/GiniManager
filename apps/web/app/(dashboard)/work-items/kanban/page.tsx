import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const columns = [
  { state: 'backlog', label: 'Backlog', color: 'border-gray-300' },
  { state: 'in_progress', label: 'In Progress', color: 'border-yellow-400' },
  { state: 'blocked', label: 'Blocked', color: 'border-red-400' },
  { state: 'in_review', label: 'In Review', color: 'border-indigo-400' },
  { state: 'done', label: 'Done', color: 'border-green-400' },
];

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const typeColors: Record<string, string> = {
  area: 'bg-indigo-100 text-indigo-700',
  project: 'bg-blue-100 text-blue-700',
  delivery: 'bg-cyan-100 text-cyan-700',
  task: 'bg-emerald-100 text-emerald-700',
  subtask: 'bg-gray-100 text-gray-600',
};

export default async function KanbanPage() {
  const supabase = createAdminClient();

  const { data: items } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority, assignee_id, estimated_minutes, actual_minutes, due_date')
    .in('item_type', ['task', 'subtask', 'delivery'])
    .order('priority')
    .order('created_at');

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_active', true);

  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));
  const allItems = items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="mt-1 text-sm text-gray-500">{allItems.length} actionable items</p>
        </div>
        <div className="flex gap-2">
          <Link href="/work-items" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            List View
          </Link>
          <Link href="/work-items/new" className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            + New
          </Link>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {columns.map(col => {
          const colItems = allItems.filter(i => i.state === col.state);
          return (
            <div key={col.state} className="flex-shrink-0 w-72">
              <div className={`rounded-t-lg border-t-4 ${col.color} bg-white border border-gray-200 rounded-b-lg`}>
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{col.label}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{colItems.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {colItems.map(item => (
                    <Link
                      key={item.id}
                      href={`/work-items/${item.id}`}
                      className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{priorityIcons[item.priority] || '⚪'}</span>
                        <p className="text-sm font-medium text-gray-900 leading-tight flex-1">{item.title}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[item.item_type] || ''}`}>
                          {item.item_type}
                        </span>
                        {item.assignee_id && (
                          <span className="text-xs text-gray-500">{userMap[item.assignee_id] || ''}</span>
                        )}
                        {item.due_date && (() => {
                          const today = new Date().toISOString().split('T')[0];
                          const isOverdue = item.due_date < today;
                          const isThisWeek = !isOverdue && item.due_date <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
                          return (
                            <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : isThisWeek ? 'text-amber-600' : 'text-gray-400'}`}>
                              {isOverdue ? '⚠️ ' : ''}
                              {new Date(item.due_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                            </span>
                          );
                        })()}
                        {item.estimated_minutes > 0 && (
                          <span className="ml-auto text-xs text-gray-400">
                            {Math.floor(item.estimated_minutes / 60)}h
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                  {colItems.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-300">Empty</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
