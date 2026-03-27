'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'collaborator', label: 'Colaborador' },
];

export default function ManageUsers({ users }: { users: User[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.get('full_name'),
          email: form.get('email'),
          role: form.get('role'),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar');
      }

      setShowCreate(false);
      setSuccess('Utilizador criado! Pode agora fazer login com o email.');
      e.currentTarget.reset();
      router.refresh();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_active: !currentActive }),
    });
    router.refresh();
  }

  async function changeRole(userId: string, newRole: string) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Gestão de Utilizadores</h2>
          <p className="text-xs text-gray-500 mt-0.5">O admin cria os utilizadores. Cada um faz login com email + código OTP.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          {showCreate ? '✕ Cancelar' : '+ Novo Utilizador'}
        </button>
      </div>

      {success && (
        <div className="px-6 py-2 bg-green-50 text-sm text-green-700">{success}</div>
      )}

      {showCreate && (
        <form onSubmit={createUser} className="px-6 py-4 bg-blue-50 border-b border-blue-100 grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nome completo</label>
            <input name="full_name" required className="w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="João Silva" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input name="email" type="email" required className="w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="joao@sier.pt" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Papel</label>
            <select name="role" defaultValue="collaborator" className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">
              {loading ? '...' : 'Criar'}
            </button>
          </div>
          {error && <p className="col-span-4 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="px-6 py-2 font-medium">Nome</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Papel</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Login</th>
            <th className="px-4 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.filter(u => u.email !== 'admin@sier.pt').map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-2.5 font-medium text-gray-900">{user.full_name}</td>
              <td className="px-4 py-2.5 text-gray-600">{user.email}</td>
              <td className="px-4 py-2.5">
                <select
                  value={user.role}
                  onChange={e => changeRole(user.id, e.target.value)}
                  className="rounded border border-gray-200 px-2 py-1 text-xs"
                >
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex items-center gap-1 text-xs ${user.is_active ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-gray-400">
                Email + OTP
              </td>
              <td className="px-4 py-2.5">
                <button
                  onClick={() => toggleActive(user.id, user.is_active)}
                  className={`text-xs ${user.is_active ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}`}
                >
                  {user.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
