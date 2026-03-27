import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';
import MyTaskList from './my-task-list';

export const dynamic = 'force-dynamic';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function MyWorkPage() {
  const supabase = createAdminClient();
  const session = await getSession();

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt')
    .order('full_name');

  // Get all non-terminal tasks (leaf items only - no children)
  const { data: allItems } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority, assignee_id, estimated_minutes, actual_minutes, due_date, parent_id')
    .not('state', 'in', '(done,cancelled,archived)')
    .order('priority')
    .order('due_date', { ascending: true, nullsFirst: false });

  // Find which items have children (parent items)
  const parentIds = new Set(
    (allItems || []).filter(i => i.parent_id).map(i => i.parent_id)
  );

  // Only leaf items (no children) can have timers
  const leafItems = (allItems || []).filter(i => !parentIds.has(i.id));

  // Today's time entries
  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('user_id, minutes, work_item_id')
    .eq('date', today);

  // Build per-user data
  const userData = (users || []).map(user => {
    const myTasks = leafItems.filter(i => i.assignee_id === user.id);
    const inProgress = myTasks.filter(i => i.state === 'in_progress');
    const backlog = myTasks.filter(i => i.state === 'backlog' || i.state === 'ready' || i.state === 'planned');
    const blocked = myTasks.filter(i => i.state === 'blocked' || i.state === 'on_hold');

    const todayMin = (todayEntries || [])
      .filter(e => e.user_id === user.id)
      .reduce((s, e) => s + (e.minutes || 0), 0);

    // Today's breakdown by task
    const todayByTask: Record<string, number> = {};
    (todayEntries || []).filter(e => e.user_id === user.id).forEach(e => {
      todayByTask[e.work_item_id] = (todayByTask[e.work_item_id] || 0) + (e.minutes || 0);
    });

    return {
      ...user,
      tasks: [...inProgress, ...backlog, ...blocked],
      inProgressCount: inProgress.length,
      totalCount: myTasks.length,
      blockedCount: blocked.length,
      todayMin,
      todayByTask,
      isCurrentUser: user.id === session?.userId,
    };
  });

  // Collaborators only see their own data, admin/manager see everyone
  const isCollaborator = session?.role === 'collaborator';
  const visibleUsers = isCollaborator
    ? userData.filter(u => u.isCurrentUser)
    : userData.sort((a, b) => {
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
        return 0;
      });

  // Items waiting on externals
  const { data: pendingDeps } = await supabase
    .from('work_item_dependencies')
    .select('*, work_item:work_items!work_item_dependencies_work_item_id_fkey(id, title, assignee_id)')
    .eq('status', 'pending')
    .in('dependency_type', ['approval', 'colleague', 'external_entity']);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">As Minhas Tarefas</h1>
        <p className="mt-1 text-sm text-gray-500">Clica ▶ para iniciar o timer numa tarefa</p>
      </div>

      {visibleUsers.map(user => (
        <div key={user.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* User Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
              {user.full_name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{user.full_name}</h3>
                {user.isCurrentUser && (
                  <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium">Tu</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {user.inProgressCount} ativa · {user.totalCount} total · {user.blockedCount > 0 ? `${user.blockedCount} bloqueada · ` : ''}
                Hoje: {formatMinutes(user.todayMin)}/8h
              </p>
            </div>
            <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (user.todayMin / 480) * 100)}%` }} />
            </div>
          </div>

          {/* Task List */}
          <MyTaskList
            userId={user.id}
            tasks={user.tasks.map(t => ({
              ...t,
              todayMinutes: user.todayByTask[t.id] || 0,
            }))}
          />
        </div>
      ))}

      {/* Pending External Dependencies */}
      {pendingDeps && pendingDeps.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="text-sm font-semibold text-orange-900">Pendente de Terceiros ({pendingDeps.length})</h2>
          <div className="mt-2 space-y-1.5">
            {pendingDeps.map(dep => (
              <div key={dep.id} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-orange-100 text-orange-700 px-1.5 py-0.5 text-xs font-medium">
                  {dep.dependency_type.replace(/_/g, ' ')}
                </span>
                {dep.work_item && (
                  <Link href={`/work-items/${dep.work_item.id}`} className="text-orange-800 hover:underline truncate">
                    {dep.work_item.title}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
