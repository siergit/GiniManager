import { createAdminClient } from '@/lib/supabase-admin';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default async function TimeEntriesSection({ workItemId }: { workItemId: string }) {
  const supabase = createAdminClient();

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, user:users!time_entries_user_id_fkey(full_name)')
    .eq('work_item_id', workItemId)
    .order('date', { ascending: false })
    .limit(20);

  const totalMinutes = entries?.reduce((s, e) => s + (e.minutes || 0), 0) || 0;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Time Entries</h2>
        <span className="text-sm text-gray-500">Total: {formatMinutes(totalMinutes)}</span>
      </div>

      {entries && entries.length > 0 ? (
        <div className="mt-3 space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 py-1.5 text-sm">
              <span className="text-gray-400 w-16">
                {new Date(entry.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
              </span>
              <span className="text-gray-700 flex-1">{entry.user?.full_name || 'Unknown'}</span>
              {entry.description && (
                <span className="text-xs text-gray-400 truncate max-w-[200px]">{entry.description}</span>
              )}
              <span className="font-medium text-gray-900 w-12 text-right">{formatMinutes(entry.minutes)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[entry.status] || ''}`}>
                {entry.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">No time entries. Use the "Log Time" button above to add one.</p>
      )}
    </div>
  );
}
