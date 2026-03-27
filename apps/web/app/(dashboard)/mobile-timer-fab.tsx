'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Timer {
  id: string;
  timer_started_at: string;
  work_item: { id: string; title: string } | null;
}

export default function MobileTimerFab() {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    async function check() {
      const userId = localStorage.getItem('gini-timer-user');
      if (!userId) return;
      const res = await fetch(`/api/timer?user_id=${userId}`);
      const data = await res.json();
      setTimer(data.timer || null);
    }
    check();
    const i = setInterval(check, 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!timer) { setElapsed(''); return; }
    function update() {
      const diff = Date.now() - new Date(timer!.timer_started_at).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [timer]);

  if (!timer) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="rounded-xl bg-green-600 text-white shadow-lg px-4 py-3 flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-white animate-pulse flex-shrink-0" />
        <span className="font-mono text-lg font-bold tabular-nums">{elapsed}</span>
        {timer.work_item && (
          <Link href={`/work-items/${timer.work_item.id}`} className="text-sm text-green-100 truncate flex-1">
            {timer.work_item.title}
          </Link>
        )}
      </div>
    </div>
  );
}
