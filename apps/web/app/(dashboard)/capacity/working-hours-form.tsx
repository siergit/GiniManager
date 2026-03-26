'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Capacity {
  id: string;
  user_id: string;
  allocation_pct: number;
  weekly_minutes: Record<string, number>;
}

export default function WorkingHoursForm({ users, capacities }: { users: { id: string; full_name: string }[]; capacities: Capacity[] }) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cap = capacities.find(c => c.user_id === selectedUser);
  const weekly = cap?.weekly_minutes || { mon: 480, tue: 480, wed: 480, thu: 480, fri: 480, sat: 0, sun: 0 };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const newWeekly = {
      mon: Number(form.get('mon')) * 60,
      tue: Number(form.get('tue')) * 60,
      wed: Number(form.get('wed')) * 60,
      thu: Number(form.get('thu')) * 60,
      fri: Number(form.get('fri')) * 60,
      sat: Number(form.get('sat')) * 60,
      sun: Number(form.get('sun')) * 60,
    };
    const allocation = Number(form.get('allocation'));

    await fetch('/api/capacity/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selectedUser, weekly_minutes: newWeekly, allocation_pct: allocation }),
    });

    setLoading(false);
    setSuccess(true);
    router.refresh();
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Editar Horário</h2>
      <div className="mt-3 mb-4">
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm">
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-9 gap-2 items-end">
        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
          <div key={day}>
            <label className="block text-xs text-gray-500 mb-1 text-center capitalize">{day}</label>
            <input
              type="number"
              name={day}
              min="0"
              max="24"
              step="0.5"
              defaultValue={weekly[day] / 60}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-center"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-gray-500 mb-1 text-center">Alloc%</label>
          <input type="number" name="allocation" min="0" max="100" defaultValue={cap?.allocation_pct || 100} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-center" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 px-2 py-1.5 text-sm text-white disabled:opacity-50">
            {loading ? '...' : 'Guardar'}
          </button>
        </div>
      </form>
      {success && <p className="mt-2 text-sm text-green-600">Horário actualizado!</p>}
    </div>
  );
}
