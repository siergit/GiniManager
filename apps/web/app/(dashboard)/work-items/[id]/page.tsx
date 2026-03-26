import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import StateChanger from './state-changer';
import CommentsSection from './comments-section';
import ChecklistSection from './checklist-section';
import InlineEdit from './inline-edit';
import DependenciesSection from './dependencies-section';
import DeleteButton from './delete-button';

export const dynamic = 'force-dynamic';

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  ready: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-indigo-100 text-indigo-700',
  waiting_approval: 'bg-orange-100 text-orange-700',
  approved: 'bg-teal-100 text-teal-700',
  blocked: 'bg-red-100 text-red-700',
  on_hold: 'bg-gray-200 text-gray-600',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-400',
  archived: 'bg-gray-50 text-gray-400',
  reopened: 'bg-amber-100 text-amber-700',
  deferred: 'bg-slate-100 text-slate-600',
  failed: 'bg-red-200 text-red-800',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const typeColors: Record<string, string> = {
  area: 'bg-indigo-600', project: 'bg-blue-600', delivery: 'bg-cyan-600', task: 'bg-emerald-600', subtask: 'bg-gray-500',
};

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function progressColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 25) return 'bg-yellow-500';
  return 'bg-red-400';
}

export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch the work item
  const { data: item, error } = await supabase
    .from('work_items')
    .select(`
      *,
      assignee:users!work_items_assignee_id_fkey(id, full_name, email),
      reporter:users!work_items_reporter_id_fkey(id, full_name),
      creator:users!work_items_created_by_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !item) notFound();

  // Fetch parent for breadcrumb
  let parent = null;
  let grandparent = null;
  if (item.parent_id) {
    const { data: p } = await supabase
      .from('work_items')
      .select('id, title, parent_id, item_type')
      .eq('id', item.parent_id)
      .single();
    parent = p;
    if (p?.parent_id) {
      const { data: gp } = await supabase
        .from('work_items')
        .select('id, title, item_type')
        .eq('id', p.parent_id)
        .single();
      grandparent = gp;
    }
  }

  // Fetch children with assignee
  const { data: children } = await supabase
    .from('work_items')
    .select('*, assignee:users!work_items_assignee_id_fkey(id, full_name)')
    .eq('parent_id', id)
    .order('sort_order')
    .order('created_at');

  // Fetch state log (logbook)
  const { data: stateLog } = await supabase
    .from('work_item_state_log')
    .select('*, changed_by_user:users!work_item_state_log_changed_by_fkey(full_name)')
    .eq('work_item_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch checklist
  const { data: checklist } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('work_item_id', id)
    .order('sort_order');

  // Fetch all active users (for assignee dropdown)
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt')
    .order('full_name');

  // Fetch all work items (for dependency selector)
  const { data: allWorkItems } = await supabase
    .from('work_items')
    .select('id, title, item_type')
    .order('title');

  // Fetch comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, user:users!comments_user_id_fkey(id, full_name)')
    .eq('work_item_id', id)
    .order('created_at', { ascending: true });

  // Calculate children stats
  const childrenCount = children?.length || 0;
  const doneChildren = children?.filter((c: { state: string }) => c.state === 'done').length || 0;
  const inProgressChildren = children?.filter((c: { state: string }) => c.state === 'in_progress').length || 0;
  const blockedChildren = children?.filter((c: { state: string }) => c.state === 'blocked').length || 0;
  const totalEstimated = children?.reduce((sum: number, c: { estimated_minutes: number }) => sum + (c.estimated_minutes || 0), 0) || 0;
  const totalActual = children?.reduce((sum: number, c: { actual_minutes: number }) => sum + (c.actual_minutes || 0), 0) || 0;

  const progress = item.progress_override ?? item.progress_pct ?? 0;
  const deviation = item.deviation_pct ?? 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/work-items" className="hover:text-blue-600">Work Items</Link>
        {grandparent && (
          <>
            <span>/</span>
            <Link href={`/work-items/${grandparent.id}`} className="hover:text-blue-600">{grandparent.title}</Link>
          </>
        )}
        {parent && (
          <>
            <span>/</span>
            <Link href={`/work-items/${parent.id}`} className="hover:text-blue-600">{parent.title}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-medium">{item.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{priorityIcons[item.priority] || '⚪'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
              <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${typeColors[item.item_type] || 'bg-gray-500'}`}>
                {item.item_type.toUpperCase()}
              </span>
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            )}
          </div>
        </div>
        <StateChanger itemId={item.id} currentState={item.state} />
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-lg font-bold text-gray-900">{Number(progress).toFixed(0)}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div className={`h-full rounded-full ${progressColor(Number(progress))} transition-all`} style={{ width: `${progress}%` }} />
        </div>
        {item.blocked_reason && (
          <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <strong>Blocked:</strong> {item.blocked_reason}
          </div>
        )}
      </div>

      {/* Info Grid - Editable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <InlineEdit
            itemId={id}
            field="assignee_id"
            value={item.assignee_id}
            type="select"
            options={(allUsers || []).map((u: { id: string; full_name: string }) => ({ value: u.id, label: u.full_name }))}
            label="Assignee"
            displayValue={item.assignee?.full_name || 'Unassigned'}
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <InlineEdit
            itemId={id}
            field="estimated_minutes"
            value={item.estimated_minutes || 0}
            type="number"
            label="Estimated (min)"
            displayValue={formatMinutes(item.estimated_minutes || 0)}
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Actual</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{formatMinutes(item.actual_minutes || 0)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{formatMinutes(item.remaining_minutes || 0)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <InlineEdit itemId={id} field="start_date" value={item.start_date} type="date" label="Start Date" displayValue={formatDate(item.start_date)} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <InlineEdit itemId={id} field="due_date" value={item.due_date} type="date" label="Due Date" displayValue={formatDate(item.due_date)} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Actual Start</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(item.actual_start_date)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Deviation</p>
          <p className={`mt-1 text-sm font-medium ${deviation > 0 ? 'text-red-600' : deviation < 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {deviation > 0 ? '+' : ''}{Number(deviation).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Children Summary */}
      {childrenCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{childrenCount}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{doneChildren}</p>
            <p className="text-xs text-gray-500">Done</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{inProgressChildren}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{blockedChildren}</p>
            <p className="text-xs text-gray-500">Blocked</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{formatMinutes(totalEstimated)}</p>
            <p className="text-xs text-gray-500">Est. Total</p>
          </div>
        </div>
      )}

      {/* Children Table */}
      {childrenCount > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">
              Children ({childrenCount})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium w-20">Type</th>
                  <th className="px-4 py-3 font-medium w-28">State</th>
                  <th className="px-4 py-3 font-medium w-10">Pri</th>
                  <th className="px-4 py-3 font-medium w-32">Assignee</th>
                  <th className="px-4 py-3 font-medium w-20 text-right">Progress</th>
                  <th className="px-4 py-3 font-medium w-20 text-right">Est.</th>
                  <th className="px-4 py-3 font-medium w-20 text-right">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {children?.map((child: { id: string; title: string; item_type: string; state: string; priority: string; progress_pct: number; estimated_minutes: number; actual_minutes: number; assignee: { full_name: string } | null }) => (
                  <tr key={child.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/work-items/${child.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {child.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium text-white ${typeColors[child.item_type] || 'bg-gray-500'}`}>
                        {child.item_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[child.state] || ''}`}>
                        {child.state.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{priorityIcons[child.priority] || '⚪'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{child.assignee?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <div className="w-12 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className={`h-full rounded-full ${progressColor(child.progress_pct || 0)}`} style={{ width: `${child.progress_pct || 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 w-8 text-right">{Number(child.progress_pct || 0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600">{formatMinutes(child.estimated_minutes || 0)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600">{formatMinutes(child.actual_minutes || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checklist */}
      <ChecklistSection workItemId={id} items={checklist || []} />

      {/* Dependencies */}
      <DependenciesSection workItemId={id} allItems={allWorkItems || []} />

      {/* Comments */}
      <CommentsSection workItemId={id} comments={comments || []} />

      {/* Logbook */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Logbook</h2>
        {stateLog && stateLog.length > 0 ? (
          <div className="mt-4 space-y-3">
            {stateLog.map((entry: { id: number; from_state: string | null; to_state: string; reason: string | null; created_at: string; changed_by_user: { full_name: string } | null }) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-medium">{entry.changed_by_user?.full_name || 'System'}</span>
                    {' changed state '}
                    {entry.from_state && (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[entry.from_state] || ''}`}>
                        {entry.from_state.replace(/_/g, ' ')}
                      </span>
                    )}
                    {' → '}
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[entry.to_state] || ''}`}>
                      {entry.to_state.replace(/_/g, ' ')}
                    </span>
                  </p>
                  {entry.reason && <p className="text-gray-500 text-xs mt-0.5">Reason: {entry.reason}</p>}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">No state changes recorded yet.</p>
        )}
      </div>

      {/* Meta */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-xs text-gray-400">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>Created by: {item.creator?.full_name || 'Unknown'}</span>
          <span>Created: {new Date(item.created_at).toLocaleString('pt-PT')}</span>
          <span>Updated: {new Date(item.updated_at).toLocaleString('pt-PT')}</span>
          <span>ID: {item.id}</span>
        </div>
        <div className="mt-2">
          <DeleteButton itemId={item.id} itemTitle={item.title} />
        </div>
      </div>
    </div>
  );
}
