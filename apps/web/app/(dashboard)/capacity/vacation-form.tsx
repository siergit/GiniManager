'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VacationForm({ users }: { users: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/capacity/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: form.get('user_id'),
          exception_type: form.get('type'),
          start_date: form.get('start_date'),
          end_date: form.get('end_date'),
          reason: form.get('reason'),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      setSuccess(true);
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Registar Ausência</h2>
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Membro</label>
          <select name="user_id" required className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipo</label>
          <select name="type" required className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
            <option value="vacation">Férias</option>
            <option value="sick_leave">Baixa</option>
            <option value="training">Formação</option>
            <option value="other_absence">Outra</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Início</label>
          <input type="date" name="start_date" required className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fim</label>
          <input type="date" name="end_date" required className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Motivo</label>
          <input type="text" name="reason" placeholder="Opcional" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            {loading ? '...' : 'Registar'}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">Ausência registada!</p>}
    </div>
  );
}
