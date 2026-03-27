'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  item_type: string;
  state: string;
  priority: string;
  estimated_minutes: number;
  actual_minutes: number;
  due_date: string | null;
  todayMinutes: number;
}

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const stateLabels: Record<string, string> = {
  in_progress: 'Em progresso', backlog: 'Backlog', ready: 'Pronto',
  planned: 'Planeado', blocked: 'Bloqueado', on_hold: 'Em espera',
};

const stateColors: Record<string, string> = {
  in_progress: 'bg-yellow-100 text-yellow-800', backlog: 'bg-gray-100 text-gray-600',
  ready: 'bg-blue-100 text-blue-700', planned: 'bg-purple-100 text-purple-700',
  blocked: 'bg-red-100 text-red-700', on_hold: 'bg-gray-200 text-gray-600',
};

function formatMin(min: number): string {
  if (min === 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h${m}m`;
}

export default function MyTaskList({ userId, tasks }: { userId: string; tasks: Task[] }) {
  const router = useRouter();
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState('');
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [stopDesc, setStopDesc] = useState('');
  const [showStopFor, setShowStopFor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [manualFor, setManualFor] = useState<string | null>(null);
  const [manualHours, setManualHours] = useState('1');
  const [manualMins, setManualMins] = useState('0');
  const [manualDesc, setManualDesc] = useState('');

  // Check for active timer
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/timer?user_id=${userId}`);
        const data = await res.json();
        if (data.timer) {
          setActiveTimerTaskId(data.timer.work_item?.id || null);
          setTimerStart(new Date(data.timer.timer_started_at).getTime());
        }
      } catch { /* ignore */ }
    }
    check();
  }, [userId]);

  // Elapsed counter
  useEffect(() => {
    if (!timerStart) { setElapsed(''); return; }
    function tick() {
      const diff = Date.now() - timerStart!;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [timerStart]);

  async function startTimer(taskId: string) {
    setLoading(taskId);
    setError('');
    try {
      const res = await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, work_item_id: taskId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveTimerTaskId(taskId);
        setTimerStart(new Date(data.timer.timer_started_at).getTime());
        setShowStopFor(null);
        setMenuFor(null);
        router.refresh();
      } else {
        setError(data.error || 'Erro ao iniciar timer');
        setTimeout(() => setError(''), 5000);
      }
    } catch {
      setError('Erro de rede');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(null);
    }
  }

  async function stopTimer() {
    setLoading('stop');
    const params = new URLSearchParams({ user_id: userId });
    if (stopDesc) params.set('description', stopDesc);
    await fetch(`/api/timer?${params}`, { method: 'DELETE' });
    setActiveTimerTaskId(null);
    setTimerStart(null);
    setElapsed('');
    setShowStopFor(null);
    setStopDesc('');
    setLoading(null);
    router.refresh();
  }

  async function logManual(taskId: string) {
    const totalMins = Math.round(parseFloat(manualHours || '0') * 60) + parseInt(manualMins || '0');
    if (totalMins <= 0) return;
    setLoading('manual');
    try {
      await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          work_item_id: taskId,
          minutes: totalMins,
          description: manualDesc || null,
        }),
      });
      setManualFor(null);
      setManualHours('1');
      setManualMins('0');
      setManualDesc('');
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  if (tasks.length === 0 && !error) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-400">
        Sem tarefas atribuídas
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {error && (
        <div className="px-4 py-2 bg-red-50 text-sm text-red-700 border-b border-red-100">
          {error}
        </div>
      )}
      {tasks.map(task => {
        const isActive = activeTimerTaskId === task.id;
        const isOverdue = task.due_date && task.due_date < today;
        const pct = task.estimated_minutes > 0
          ? Math.round((task.actual_minutes / task.estimated_minutes) * 100)
          : 0;
        const isOver = pct > 100;

        return (
          <div key={task.id} className={`transition-colors ${isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Play/Stop Button */}
              <div className="flex-shrink-0">
                {isActive ? (
                  <button
                    onClick={() => showStopFor === task.id ? stopTimer() : setShowStopFor(task.id)}
                    disabled={loading === 'stop'}
                    className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm"
                    title="Parar timer"
                  >
                    {loading === 'stop' ? '...' : '⏹'}
                  </button>
                ) : (
                  <button
                    onClick={() => startTimer(task.id)}
                    disabled={loading === task.id}
                    className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-sm"
                    title="Iniciar timer"
                  >
                    {loading === task.id ? (
                      <span className="animate-spin text-xs">⏳</span>
                    ) : '▶'}
                  </button>
                )}
              </div>

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span>{priorityIcons[task.priority] || '⚪'}</span>
                  <Link href={`/work-items/${task.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                    {task.title}
                  </Link>
                </div>

                {/* Progress bar + percentage */}
                {task.estimated_minutes > 0 && (
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden max-w-[200px]">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-blue-400'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium tabular-nums ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
                      {pct}%
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatMin(task.actual_minutes)} / {formatMin(task.estimated_minutes)}
                    </span>
                    {isOver && <span className="text-[10px] text-red-500 font-medium">excedido!</span>}
                  </div>
                )}

                {/* Active timer elapsed */}
                {isActive && elapsed && (
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono text-base font-bold text-green-700 tabular-nums">{elapsed}</span>
                    <span className="text-xs text-green-600">a decorrer...</span>
                  </div>
                )}
              </div>

              {/* State badge */}
              <span className={`hidden sm:inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${stateColors[task.state] || 'bg-gray-100 text-gray-600'}`}>
                {stateLabels[task.state] || task.state}
              </span>

              {/* Due date */}
              {task.due_date && (
                <span className={`hidden lg:inline-block text-[10px] whitespace-nowrap ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                  {isOverdue && '⚠ '}
                  {new Date(task.due_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </span>
              )}

              {/* Today's time */}
              {task.todayMinutes > 0 && (
                <span className="text-[10px] text-blue-600 font-medium whitespace-nowrap">
                  hoje {formatMin(task.todayMinutes)}
                </span>
              )}

              {/* ... Menu button */}
              <div className="relative">
                <button
                  onClick={() => setMenuFor(menuFor === task.id ? null : task.id)}
                  className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  ⋯
                </button>
                {menuFor === task.id && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                    <button
                      onClick={() => { setManualFor(task.id); setMenuFor(null); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      ⏱ Registar tempo manual
                    </button>
                    <Link
                      href={`/work-items/${task.id}`}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      📋 Ver detalhes
                    </Link>
                    <button
                      onClick={() => { setMenuFor(null); }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stop description input */}
            {showStopFor === task.id && (
              <div className="px-4 pb-3 ml-14">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={stopDesc}
                    onChange={e => setStopDesc(e.target.value)}
                    placeholder="O que fizeste? (Enter para parar)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') stopTimer(); }}
                  />
                  <button onClick={stopTimer} disabled={loading === 'stop'} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white font-medium">
                    Parar
                  </button>
                </div>
              </div>
            )}

            {/* Manual time entry form */}
            {manualFor === task.id && (
              <div className="px-4 pb-3 ml-14">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700 font-medium mb-2">Registar tempo manual</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <input type="number" value={manualHours} onChange={e => setManualHours(e.target.value)} min="0" max="24" step="0.5" className="w-14 rounded border border-gray-300 px-2 py-1.5 text-sm text-center" />
                      <span className="text-xs text-gray-500">h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="number" value={manualMins} onChange={e => setManualMins(e.target.value)} min="0" max="59" step="5" className="w-14 rounded border border-gray-300 px-2 py-1.5 text-sm text-center" />
                      <span className="text-xs text-gray-500">m</span>
                    </div>
                    <input
                      type="text"
                      value={manualDesc}
                      onChange={e => setManualDesc(e.target.value)}
                      placeholder="Descrição..."
                      className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                      onKeyDown={e => { if (e.key === 'Enter') logManual(task.id); }}
                    />
                    <button onClick={() => logManual(task.id)} disabled={loading === 'manual'} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">
                      {loading === 'manual' ? '...' : 'Registar'}
                    </button>
                    <button onClick={() => setManualFor(null)} className="text-gray-400 text-sm">✕</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
