import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import ExportCSV from '../export-csv';

export const dynamic = 'force-dynamic';

function formatMinutes(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function perfColor(pct: number): string {
  if (pct >= 90) return 'text-green-700 bg-green-50';
  if (pct >= 70) return 'text-yellow-700 bg-yellow-50';
  return 'text-red-700 bg-red-50';
}

export default async function WeeklyReportPage() {
  const supabase = createAdminClient();

  // Current week Monday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const weekStart = monday.toISOString().split('T')[0];
  const friday = new Date(monday.getTime() + 4 * 86400000);
  const weekEnd = friday.toISOString().split('T')[0];

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt')
    .order('full_name');

  const { data: entries } = await supabase
    .from('time_entries')
    .select('user_id, minutes, date, work_item_id')
    .gte('date', weekStart)
    .lte('date', weekEnd);

  const { data: stateChanges } = await supabase
    .from('work_item_state_log')
    .select('to_state, changed_by')
    .gte('created_at', weekStart + 'T00:00:00')
    .lte('created_at', weekEnd + 'T23:59:59');

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const weekDates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday.getTime() + i * 86400000);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  const userRows = (users || []).map(user => {
    const userEntries = (entries || []).filter(e => e.user_id === user.id);
    const totalMin = userEntries.reduce((s, e) => s + (e.minutes || 0), 0);
    const dailyMin = weekDates.map(date =>
      userEntries.filter(e => e.date === date).reduce((s, e) => s + (e.minutes || 0), 0)
    );
    const completed = (stateChanges || []).filter(s => s.changed_by === user.id && s.to_state === 'done').length;
    const perf = Math.round((totalMin / 2400) * 100); // 5 days * 8h = 2400 min

    return { id: user.id, name: user.full_name, totalMin, dailyMin, completed, perf };
  });

  const teamTotal = userRows.reduce((s, r) => s + r.totalMin, 0);
  const teamCompleted = userRows.reduce((s, r) => s + r.completed, 0);
  const teamPerf = userRows.length > 0 ? Math.round((teamTotal / (userRows.length * 2400)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Semanal</h1>
          <p className="mt-1 text-sm text-gray-500">
            Semana de {new Date(weekStart + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })} a {new Date(weekEnd + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reports" className="text-sm text-blue-600 hover:underline">← Relatórios gerais</Link>
          <ExportCSV endpoint="/api/reports/weekly-summary" filename="weekly-report" />
        </div>
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Total Equipa</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatMinutes(teamTotal)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Performance</p>
          <p className={`mt-1 text-2xl font-bold ${teamPerf >= 90 ? 'text-green-700' : teamPerf >= 70 ? 'text-yellow-700' : 'text-red-700'}`}>{teamPerf}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Tarefas Concluídas</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{teamCompleted}</p>
        </div>
      </div>

      {/* Per User Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Membro</th>
              {weekDays.map((d, i) => (
                <th key={d} className="px-2 py-3 font-medium text-center w-16">
                  <div>{d}</div>
                  <div className="text-[10px] text-gray-400 normal-case font-normal">
                    {new Date(weekDates[i] + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 font-medium text-center w-16">Total</th>
              <th className="px-3 py-3 font-medium text-center w-20">Perf</th>
              <th className="px-3 py-3 font-medium text-center w-16">Done</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {userRows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                {row.dailyMin.map((min, i) => (
                  <td key={i} className="px-2 py-2.5 text-center">
                    <span className={`text-xs ${min >= 480 ? 'text-green-700 font-medium' : min > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                      {min > 0 ? formatMinutes(min) : '—'}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-2.5 text-center font-medium text-gray-900">{formatMinutes(row.totalMin)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${perfColor(row.perf)}`}>
                    {row.perf}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-green-700 font-medium">{row.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
