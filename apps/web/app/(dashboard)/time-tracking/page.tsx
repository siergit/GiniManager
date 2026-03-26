import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import TimeEntryForm from './time-entry-form';

export const dynamic = 'force-dynamic';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default async function TimeTrackingPage() {
  const supabase = createAdminClient();

  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name');

  // Get recent time entries (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, work_item:work_items(id, title, item_type), user:users!time_entries_user_id_fkey(id, full_name)')
    .gte('date', weekAgoStr)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  // Get work items for the form dropdown (tasks and subtasks)
  const { data: workItems } = await supabase
    .from('work_items')
    .select('id, title, item_type, parent_id')
    .in('item_type', ['task', 'subtask', 'delivery'])
    .order('title');

  // Calculate today's total
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries?.filter(e => e.date === today) || [];
  const todayTotal = todayEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);

  // Calculate week total
  const weekTotal = entries?.reduce((sum, e) => sum + (e.minutes || 0), 0) || 0;

  // Per-user totals this week
  const userTotals: Record<string, { name: string; minutes: number; entries: number }> = {};
  entries?.forEach(e => {
    const uid = e.user_id;
    const name = e.user?.full_name || 'Unknown';
    if (!userTotals[uid]) userTotals[uid] = { name, minutes: 0, entries: 0 };
    userTotals[uid].minutes += e.minutes || 0;
    userTotals[uid].entries += 1;
  });

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">Track time on work items</p>
        <Link href="/time-tracking/approvals" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Aprovação de horas →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatMinutes(todayTotal)}</p>
          <p className="text-xs text-gray-400">{todayEntries.length} entries</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatMinutes(weekTotal)}</p>
          <p className="text-xs text-gray-400">{entries?.length || 0} entries</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Team Members Active</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{Object.keys(userTotals).length}</p>
          <p className="text-xs text-gray-400">of {users?.length || 0} total</p>
        </div>
      </div>

      {/* Per-user breakdown */}
      {Object.keys(userTotals).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Team This Week</h2>
          <div className="mt-3 space-y-2">
            {Object.values(userTotals).sort((a, b) => b.minutes - a.minutes).map((u) => (
              <div key={u.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{u.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (u.minutes / 2400) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">{formatMinutes(u.minutes)}</span>
                  <span className="text-xs text-gray-400 w-16 text-right">{u.entries} entries</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Entry Form */}
      <TimeEntryForm users={users || []} workItems={workItems || []} />

      {/* Recent Entries Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">Recent Entries (Last 7 Days)</h2>
        </div>
        {entries && entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Work Item</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium w-20 text-right">Duration</th>
                  <th className="px-4 py-2 font-medium w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-900">
                      {new Date(entry.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{entry.user?.full_name || '—'}</td>
                    <td className="px-4 py-2.5">
                      {entry.work_item ? (
                        <Link href={`/work-items/${entry.work_item.id}`} className="text-blue-600 hover:underline">
                          {entry.work_item.title}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-xs truncate">{entry.description || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatMinutes(entry.minutes)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[entry.status] || ''}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No time entries yet. Use the form above to log your first entry.
          </div>
        )}
      </div>
    </div>
  );
}
