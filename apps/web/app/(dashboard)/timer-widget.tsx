'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ActiveTimer {
  id: string;
  timer_started_at: string;
  work_item: { id: string; title: string } | null;
  user_id: string;
}

// Default user for admin mode
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

export default function TimerWidget() {
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [description, setDescription] = useState('');

  const fetchTimer = useCallback(async () => {
    try {
      const res = await fetch(`/api/timer?user_id=${DEFAULT_USER_ID}`);
      const data = await res.json();
      setTimer(data.timer || null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchTimer();
    const interval = setInterval(fetchTimer, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchTimer]);

  // Update elapsed every second
  useEffect(() => {
    if (!timer) { setElapsed('00:00:00'); return; }

    function update() {
      const started = new Date(timer!.timer_started_at).getTime();
      const diff = Date.now() - started;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  async function stopTimer() {
    setLoading(true);
    const params = new URLSearchParams({ user_id: DEFAULT_USER_ID });
    if (description) params.set('description', description);
    await fetch(`/api/timer?${params}`, { method: 'DELETE' });
    setTimer(null);
    setShowStop(false);
    setDescription('');
    setLoading(false);
  }

  if (!timer) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        Sem timer ativo
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-mono text-sm font-bold text-green-700 dark:text-green-400 tabular-nums">
          {elapsed}
        </span>
      </div>

      {timer.work_item && (
        <Link href={`/work-items/${timer.work_item.id}`} className="text-xs text-blue-600 hover:underline max-w-[200px] truncate">
          {timer.work_item.title}
        </Link>
      )}

      {!showStop ? (
        <button
          onClick={() => setShowStop(true)}
          className="rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
        >
          Stop
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="O que fizeste?"
            className="rounded border border-gray-300 px-2 py-1 text-xs w-36"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') stopTimer(); }}
          />
          <button
            onClick={stopTimer}
            disabled={loading}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            {loading ? '...' : 'Parar'}
          </button>
          <button onClick={() => setShowStop(false)} className="text-xs text-gray-400">x</button>
        </div>
      )}
    </div>
  );
}
