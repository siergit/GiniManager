'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickTimeLog({ workItemId, users }: { workItemId: string; users: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const hours = parseFloat(form.get('hours') as string) || 0;
    const mins = parseInt(form.get('mins') as string) || 0;
    const total = Math.round(hours * 60) + mins;

    if (total <= 0) { setLoading(false); return; }

    try {
      await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: form.get('user_id'),
          work_item_id: workItemId,
          date: form.get('date'),
          minutes: total,
          description: form.get('description'),
        }),
      });
      setSuccess(true);
      setOpen(false);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {!open ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            ⏱ Log Time
          </button>
          {success && <span className="text-sm text-green-600">Logged!</span>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <select name="user_id" required className="rounded border border-gray-300 px-2 py-1.5 text-sm">
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
            <input type="date" name="date" defaultValue={today} className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
            <div className="flex gap-1">
              <input type="number" name="hours" min="0" max="24" step="0.5" defaultValue="1" placeholder="h" className="rounded border border-gray-300 px-2 py-1.5 text-sm w-16" />
              <input type="number" name="mins" min="0" max="59" step="5" defaultValue="0" placeholder="m" className="rounded border border-gray-300 px-2 py-1.5 text-sm w-16" />
            </div>
            <input type="text" name="description" placeholder="Notes..." className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
            <div className="flex gap-1">
              <button type="submit" disabled={loading} className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
                {loading ? '...' : 'Log'}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
                ✕
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
