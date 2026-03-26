import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import ApprovalActions from './approval-actions';

export const dynamic = 'force-dynamic';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function ApprovalsPage() {
  const supabase = createAdminClient();

  const { data: pending } = await supabase
    .from('time_entries')
    .select('*, user:users!time_entries_user_id_fkey(full_name), work_item:work_items(id, title)')
    .eq('status', 'submitted')
    .order('date', { ascending: false });

  const { data: recent } = await supabase
    .from('time_entries')
    .select('*, user:users!time_entries_user_id_fkey(full_name), work_item:work_items(id, title)')
    .in('status', ['approved', 'rejected'])
    .order('approved_at', { ascending: false })
    .limit(20);

  const totalPendingMinutes = pending?.reduce((s, e) => s + (e.minutes || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprovação de Horas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pending?.length || 0} entradas pendentes ({formatMinutes(totalPendingMinutes)})
          </p>
        </div>
        <Link href="/time-tracking" className="text-sm text-blue-600 hover:underline">← Time Tracking</Link>
      </div>

      {/* Pending */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-yellow-50">
          <h2 className="text-sm font-semibold text-yellow-800">Pendentes de Aprovação</h2>
        </div>
        {pending && pending.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {pending.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{entry.user?.full_name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(entry.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  {entry.work_item && (
                    <Link href={`/work-items/${entry.work_item.id}`} className="text-xs text-blue-600 hover:underline">
                      {entry.work_item.title}
                    </Link>
                  )}
                  {entry.description && <p className="text-xs text-gray-400 mt-0.5">{entry.description}</p>}
                </div>
                <span className="text-sm font-bold text-gray-900">{formatMinutes(entry.minutes)}</span>
                <ApprovalActions entryId={entry.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Todas as entradas aprovadas!</div>
        )}
      </div>

      {/* Recent decisions */}
      {recent && recent.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Decisões Recentes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="text-gray-600">{entry.user?.full_name}</span>
                <span className="text-gray-400">-</span>
                <span className="text-gray-600 flex-1 truncate">{entry.work_item?.title}</span>
                <span className="text-gray-900 font-medium">{formatMinutes(entry.minutes)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  entry.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{entry.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
