import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const priorityOrder: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3, none: 4,
};

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function MyWorkPage() {
  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt')
    .order('full_name');

  // Get all non-terminal work items with assignments
  const { data: allItems } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority, assignee_id, estimated_minutes, actual_minutes, due_date, parent_id')
    .not('state', 'in', '(done,cancelled,archived)')
    .order('priority')
    .order('due_date', { ascending: true, nullsFirst: false });

  // Get items blocked on external entities (dependency type = external_entity, status = pending)
  const { data: externalDeps } = await supabase
    .from('work_item_dependencies')
    .select('*, work_item:work_items!work_item_dependencies_work_item_id_fkey(id, title, state, assignee_id), external:external_entities!work_item_dependencies_depends_on_external_entity_id_fkey(name)')
    .eq('dependency_type', 'external_entity')
    .eq('status', 'pending');

  // Get items with any pending dependency (colleague, approval, external)
  const { data: pendingDeps } = await supabase
    .from('work_item_dependencies')
    .select('*, work_item:work_items!work_item_dependencies_work_item_id_fkey(id, title, state, priority, assignee_id)')
    .eq('status', 'pending')
    .in('dependency_type', ['approval', 'colleague', 'external_entity']);

  // Get today's time entries per user
  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('user_id, minutes, work_item_id')
    .eq('date', today);

  const items = allItems || [];

  // Check which items have subtasks (to know if time can be logged)
  const parentIds = new Set(items.filter(i => i.parent_id).map(i => i.parent_id));

  const todayByUser: Record<string, number> = {};
  todayEntries?.forEach(e => {
    todayByUser[e.user_id] = (todayByUser[e.user_id] || 0) + (e.minutes || 0);
  });

  // Active timer (current task being worked on) - items in_progress with recent time entry
  const activeByUser: Record<string, string | null> = {};
  todayEntries?.forEach(e => {
    if (e.work_item_id) activeByUser[e.user_id] = e.work_item_id;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão por Pessoa</h1>
        <p className="mt-1 text-sm text-gray-500">O que cada membro está a fazer e próximas tarefas</p>
      </div>

      {/* Per-person cards */}
      <div className="space-y-6">
        {users?.map(user => {
          const userItems = items.filter(i => i.assignee_id === user.id);
          const currentTask = userItems.find(i => i.state === 'in_progress');
          const nextTasks = userItems
            .filter(i => i.state !== 'in_progress' && !parentIds.has(i.id))
            .sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4))
            .slice(0, 10);
          const blockedTasks = userItems.filter(i => i.state === 'blocked');
          const todayMin = todayByUser[user.id] || 0;

          return (
            <div key={user.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                  {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{user.full_name}</h3>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatMinutes(todayMin)}</p>
                  <p className="text-xs text-gray-400">hoje / 8h</p>
                </div>
                <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (todayMin / 480) * 100)}%` }} />
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Current Task */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">A trabalhar em</p>
                  {currentTask ? (
                    <Link href={`/work-items/${currentTask.id}`} className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-2.5 hover:bg-yellow-100 transition-colors">
                      <span>{priorityIcons[currentTask.priority]}</span>
                      <span className="text-sm font-medium text-gray-900">{currentTask.title}</span>
                      {currentTask.estimated_minutes > 0 && (
                        <span className="ml-auto text-xs text-gray-500">{formatMinutes(currentTask.actual_minutes)}/{formatMinutes(currentTask.estimated_minutes)}</span>
                      )}
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sem tarefa em progresso</p>
                  )}
                </div>

                {/* Blocked */}
                {blockedTasks.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">🚫 Bloqueadas ({blockedTasks.length})</p>
                    {blockedTasks.slice(0, 3).map(t => (
                      <Link key={t.id} href={`/work-items/${t.id}`} className="flex items-center gap-2 py-1 text-sm text-red-700 hover:underline">
                        <span>{priorityIcons[t.priority]}</span>
                        {t.title}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Next 10 by Priority */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Próximas tarefas ({nextTasks.length})</p>
                  {nextTasks.length > 0 ? (
                    <div className="space-y-1">
                      {nextTasks.map((t, i) => (
                        <Link key={t.id} href={`/work-items/${t.id}`} className="flex items-center gap-2 py-1 text-sm hover:bg-gray-50 rounded px-1 -mx-1">
                          <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                          <span>{priorityIcons[t.priority]}</span>
                          <span className="flex-1 text-gray-900 truncate">{t.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[t.state] || 'bg-gray-100 text-gray-700'}`}>
                            {t.state.replace(/_/g, ' ')}
                          </span>
                          {t.due_date && (
                            <span className={`text-xs ${t.due_date < today ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                              {new Date(t.due_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                          {t.estimated_minutes > 0 && (
                            <span className="text-xs text-gray-400">{formatMinutes(t.estimated_minutes)}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sem tarefas pendentes</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending External Dependencies */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Pendente de Terceiros</h2>
        <p className="text-xs text-gray-500 mt-1">Tarefas bloqueadas por aprovação, colegas ou entidades externas</p>
        {pendingDeps && pendingDeps.length > 0 ? (
          <div className="mt-3 space-y-2">
            {pendingDeps.map(dep => (
              <div key={dep.id} className="flex items-center gap-3 text-sm py-1">
                <span className="text-xs rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 font-medium">
                  {dep.dependency_type.replace(/_/g, ' ')}
                </span>
                {dep.work_item ? (
                  <Link href={`/work-items/${dep.work_item.id}`} className="text-blue-600 hover:underline flex-1 truncate">
                    {dep.work_item.title}
                  </Link>
                ) : <span className="text-gray-400 flex-1">Unknown</span>}
                {dep.work_item?.assignee_id && (
                  <span className="text-xs text-gray-500">
                    {users?.find(u => u.id === dep.work_item.assignee_id)?.full_name || ''}
                  </span>
                )}
                <span className="text-xs text-yellow-600 font-medium">pending</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">Nenhuma dependência pendente de terceiros.</p>
        )}
      </div>
    </div>
  );
}
