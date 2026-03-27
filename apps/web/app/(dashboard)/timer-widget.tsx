'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ActiveTimer {
  id: string;
  timer_started_at: string;
  work_item: { id: string; title: string } | null;
  user_id: string;
}

interface User {
  id: string;
  full_name: string;
}

export default function TimerWidget() {
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Load users and saved preference
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        const userList = (d.data || []).filter((u: User & { email: string }) => u.email !== 'admin@sier.pt');
        setUsers(userList);
        const saved = localStorage.getItem('gini-timer-user');
        if (saved && userList.find((u: User) => u.id === saved)) {
          setSelectedUserId(saved);
        } else if (userList.length > 0) {
          setSelectedUserId(userList[0].id);
        }
      });
  }, []);

  function changeUser(id: string) {
    setSelectedUserId(id);
    localStorage.setItem('gini-timer-user', id);
  }

  const fetchTimer = useCallback(async () => {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`/api/timer?user_id=${selectedUserId}`);
      const data = await res.json();
      setTimer(data.timer || null);
    } catch { /* ignore */ }
  }, [selectedUserId]);

  useEffect(() => {
    fetchTimer();
    const interval = setInterval(fetchTimer, 30000);
    return () => clearInterval(interval);
  }, [fetchTimer]);

  // Elapsed counter
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
    const params = new URLSearchParams({ user_id: selectedUserId });
    if (description) params.set('description', description);
    await fetch(`/api/timer?${params}`, { method: 'DELETE' });
    setTimer(null);
    setShowStop(false);
    setDescription('');
    setLoading(false);
  }

  const selectedUser = users.find(u => u.id === selectedUserId);
  const initials = selectedUser?.full_name.split(' ').map(n => n[0]).join('') || '?';

  return (
    <div className="flex items-center gap-2">
      {/* User selector */}
      <div className="relative group">
        <button className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white" title={selectedUser?.full_name || 'Select user'}>
          {initials}
        </button>
        <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 rounded-lg border border-gray-200 bg-white shadow-lg p-1 w-44">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => changeUser(u.id)}
              className={`w-full text-left rounded px-2.5 py-1.5 text-xs ${u.id === selectedUserId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {u.full_name}
            </button>
          ))}
        </div>
      </div>

      {timer ? (
        <>
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-sm font-bold text-green-700 dark:text-green-400 tabular-nums">
            {elapsed}
          </span>
          {timer.work_item && (
            <Link href={`/work-items/${timer.work_item.id}`} className="text-xs text-blue-600 hover:underline max-w-[160px] truncate hidden lg:inline">
              {timer.work_item.title}
            </Link>
          )}
          {!showStop ? (
            <button onClick={() => setShowStop(true)} className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200">
              ⏹ Stop
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="O que fizeste?"
                className="rounded border border-gray-300 px-2 py-1 text-xs w-28"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') stopTimer(); }}
              />
              <button onClick={stopTimer} disabled={loading} className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50">
                {loading ? '...' : 'Parar'}
              </button>
              <button onClick={() => setShowStop(false)} className="text-xs text-gray-400">✕</button>
            </div>
          )}
        </>
      ) : (
        <span className="text-xs text-gray-400">Sem timer</span>
      )}
    </div>
  );
}
