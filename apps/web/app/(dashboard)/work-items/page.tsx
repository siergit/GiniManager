import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  ready: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const typeLabels: Record<string, string> = {
  area: 'Area', project: 'Project', delivery: 'Delivery', task: 'Task', subtask: 'Subtask',
};

export default async function WorkItemsPage() {
  const supabase = createAdminClient();

  const { data: areas } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority')
    .is('parent_id', null)
    .eq('item_type', 'area')
    .order('sort_order');

  const areasWithChildren = await Promise.all(
    (areas || []).map(async (area) => {
      const { data: children } = await supabase
        .from('work_items')
        .select('id, title, item_type, state, priority, assignee_id, estimated_minutes, actual_minutes')
        .eq('parent_id', area.id)
        .order('sort_order');

      const childrenWithCounts = await Promise.all(
        (children || []).map(async (child) => {
          const { count: totalCount } = await supabase
            .from('work_items')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', child.id);
          const { count: doneCount } = await supabase
            .from('work_items')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', child.id)
            .eq('state', 'done');
          return { ...child, totalCount: totalCount || 0, doneCount: doneCount || 0 };
        })
      );
      return { ...area, children: childrenWithCounts };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Items</h1>
          <p className="mt-1 text-sm text-gray-500">{areas?.length || 0} areas - live from Supabase</p>
        </div>
        <Link href="/work-items/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + New Item
        </Link>
      </div>

      <div className="space-y-4">
        {areasWithChildren.map((area) => (
          <div key={area.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="text-lg">{priorityIcons[area.priority] || '⚪'}</span>
              <Link href={`/work-items/${area.id}`} className="text-base font-semibold text-gray-900 hover:text-blue-600">{area.title}</Link>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateColors[area.state] || 'bg-gray-100 text-gray-700'}`}>
                {area.state.replace(/_/g, ' ')}
              </span>
              <span className="ml-auto text-xs text-gray-400 uppercase tracking-wide">{typeLabels[area.item_type]}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {area.children.map((child: { id: string; title: string; item_type: string; state: string; priority: string; totalCount: number; doneCount: number }) => (
                <Link key={child.id} href={`/work-items/${child.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors">
                  <div className="ml-6 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{priorityIcons[child.priority] || '⚪'}</span>
                      <p className="text-sm font-medium text-gray-900 truncate">{child.title}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateColors[child.state] || 'bg-gray-100 text-gray-700'}`}>
                    {child.state.replace(/_/g, ' ')}
                  </span>
                  {child.totalCount > 0 && (
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${(child.doneCount / child.totalCount) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{child.doneCount}/{child.totalCount}</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-400 uppercase tracking-wide w-16 text-right">{typeLabels[child.item_type]}</span>
                </Link>
              ))}
              {area.children.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No child items yet</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
