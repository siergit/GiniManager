'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  users: { id: string; full_name: string; email: string }[];
  workItems: { id: string; title: string; item_type: string }[];
}

export default function TimeEntryForm({ users, workItems }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const hours = parseFloat(form.get('hours') as string) || 0;
    const mins = parseInt(form.get('extra_mins') as string) || 0;
    const totalMinutes = Math.round(hours * 60) + mins;

    if (totalMinutes <= 0) {
      setError('Duration must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: form.get('user_id'),
          work_item_id: form.get('work_item_id'),
          date: form.get('date'),
          minutes: totalMinutes,
          description: form.get('description'),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create entry');
      }

      setSuccess(true);
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Log Time Entry</h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">User</label>
            <select name="user_id" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {users.filter(u => u.email !== 'admin@sier.pt').map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Work Item</label>
            <select name="work_item_id" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select...</option>
              {workItems.map(wi => (
                <option key={wi.id} value={wi.id}>[{wi.item_type}] {wi.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
            <input type="date" name="date" defaultValue={today} required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</label>
              <input type="number" name="hours" min="0" max="24" step="0.5" defaultValue="1" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">+Min</label>
              <input type="number" name="extra_mins" min="0" max="59" step="5" defaultValue="0" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Description (optional)</label>
          <input type="text" name="description" placeholder="What did you work on?" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Time entry logged successfully!</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging...' : 'Log Time'}
        </button>
      </form>
    </div>
  );
}
