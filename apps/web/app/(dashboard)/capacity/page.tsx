import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import VacationForm from './vacation-form';
import WorkingHoursForm from './working-hours-form';

export const dynamic = 'force-dynamic';

// Portuguese National Holidays 2026
const PT_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Ano Novo' },
  { date: '2026-02-17', name: 'Carnaval' },
  { date: '2026-04-03', name: 'Sexta-feira Santa' },
  { date: '2026-04-05', name: 'Páscoa' },
  { date: '2026-04-25', name: 'Dia da Liberdade' },
  { date: '2026-05-01', name: 'Dia do Trabalhador' },
  { date: '2026-06-04', name: 'Corpo de Deus' },
  { date: '2026-06-10', name: 'Dia de Portugal' },
  { date: '2026-08-15', name: 'Assunção de Nossa Senhora' },
  { date: '2026-10-05', name: 'Implantação da República' },
  { date: '2026-11-01', name: 'Todos os Santos' },
  { date: '2026-12-01', name: 'Restauração da Independência' },
  { date: '2026-12-08', name: 'Imaculada Conceição' },
  { date: '2026-12-25', name: 'Natal' },
];

const exceptionTypeLabels: Record<string, string> = {
  vacation: 'Férias',
  sick_leave: 'Baixa médica',
  public_holiday: 'Feriado',
  training: 'Formação',
  other_absence: 'Outra ausência',
  extra_availability: 'Disponibilidade extra',
};

const exceptionColors: Record<string, string> = {
  vacation: 'bg-blue-100 text-blue-700',
  sick_leave: 'bg-red-100 text-red-700',
  public_holiday: 'bg-purple-100 text-purple-700',
  training: 'bg-green-100 text-green-700',
  other_absence: 'bg-gray-100 text-gray-700',
  extra_availability: 'bg-emerald-100 text-emerald-700',
};

export default async function CapacityPage() {
  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt')
    .order('full_name');

  const { data: capacities } = await supabase
    .from('capacity_profiles')
    .select('*')
    .is('effective_to', null);

  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('*, user:users!availability_exceptions_user_id_fkey(full_name)')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('start_date');

  const capacityMap: Record<string, { type: string; allocation: number; weekly: Record<string, number> }> = {};
  capacities?.forEach(c => {
    capacityMap[c.user_id] = {
      type: c.capacity_type,
      allocation: c.allocation_pct,
      weekly: c.weekly_minutes as Record<string, number>,
    };
  });

  // Next holidays
  const today = new Date().toISOString().split('T')[0];
  const upcomingHolidays = PT_HOLIDAYS_2026.filter(h => h.date >= today).slice(0, 5);

  // Current month calendar
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday = 0

  const monthName = now.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  const days: { date: string; day: number; isToday: boolean; isWeekend: boolean; isHoliday: string | null; hasException: string | null }[] = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const holiday = PT_HOLIDAYS_2026.find(h => h.date === dateStr);
    const exception = exceptions?.find(e => dateStr >= e.start_date && dateStr <= e.end_date);
    days.push({
      date: dateStr,
      day: d,
      isToday: dateStr === today,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: holiday?.name || null,
      hasException: exception ? `${exception.user?.full_name}: ${exceptionTypeLabels[exception.exception_type] || exception.exception_type}` : null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendário & Capacidade</h1>
        <p className="mt-1 text-sm text-gray-500">Férias, feriados e horários de trabalho</p>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthName}</h2>
        <div className="mt-4 grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500">{d}</div>
          ))}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-white py-3" />
          ))}
          {days.map(day => (
            <div
              key={day.date}
              className={`relative py-2 px-1 text-center text-sm min-h-[48px] ${
                day.isToday ? 'bg-blue-50 font-bold' :
                day.isWeekend ? 'bg-gray-50 text-gray-400' :
                day.isHoliday ? 'bg-purple-50' :
                day.hasException ? 'bg-blue-50' :
                'bg-white'
              }`}
              title={day.isHoliday || day.hasException || ''}
            >
              <span className={day.isToday ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs' : ''}>
                {day.day}
              </span>
              {day.isHoliday && <div className="text-[8px] text-purple-600 leading-tight mt-0.5 truncate">{day.isHoliday}</div>}
              {day.hasException && !day.isHoliday && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-500" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Holidays */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Próximos Feriados</h2>
          <div className="mt-3 space-y-2">
            {upcomingHolidays.map(h => (
              <div key={h.date} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">{h.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(h.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Absences */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Ausências Programadas</h2>
          <div className="mt-3 space-y-2">
            {exceptions && exceptions.length > 0 ? exceptions.slice(0, 8).map(ex => (
              <div key={ex.id} className="flex items-center gap-2 py-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${exceptionColors[ex.exception_type] || 'bg-gray-100'}`}>
                  {exceptionTypeLabels[ex.exception_type] || ex.exception_type}
                </span>
                <span className="text-sm text-gray-700">{ex.user?.full_name}</span>
                <span className="ml-auto text-xs text-gray-500">
                  {new Date(ex.start_date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  {ex.start_date !== ex.end_date && ` - ${new Date(ex.end_date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-400">Nenhuma ausência programada</p>
            )}
          </div>
        </div>
      </div>

      {/* Working Hours per User */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">Horário de Trabalho</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Membro</th>
              <th className="px-2 py-2 font-medium text-center">Seg</th>
              <th className="px-2 py-2 font-medium text-center">Ter</th>
              <th className="px-2 py-2 font-medium text-center">Qua</th>
              <th className="px-2 py-2 font-medium text-center">Qui</th>
              <th className="px-2 py-2 font-medium text-center">Sex</th>
              <th className="px-2 py-2 font-medium text-center">Total/sem</th>
              <th className="px-2 py-2 font-medium text-center">Alloc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users?.map(user => {
              const cap = capacityMap[user.id];
              const weekly = cap?.weekly || { mon: 480, tue: 480, wed: 480, thu: 480, fri: 480, sat: 0, sun: 0 };
              const totalWeek = Object.values(weekly).reduce((s: number, v: number) => s + v, 0);
              const effectiveWeek = Math.round(totalWeek * (cap?.allocation || 100) / 100);
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{user.full_name}</td>
                  {['mon', 'tue', 'wed', 'thu', 'fri'].map(day => (
                    <td key={day} className="px-2 py-2.5 text-center text-gray-600">
                      {(weekly[day] || 0) / 60}h
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center font-medium text-gray-900">{Math.round(totalWeek / 60)}h</td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      (cap?.allocation || 100) === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cap?.allocation || 100}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Request Vacation */}
      <VacationForm users={users || []} />

      {/* Edit Working Hours */}
      <WorkingHoursForm users={users || []} capacities={capacities || []} />
    </div>
  );
}
