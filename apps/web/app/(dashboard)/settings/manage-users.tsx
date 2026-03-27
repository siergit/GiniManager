'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  pin_hash: string | null;
}

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'collaborator', label: 'Colaborador' },
];

export default function ManageUsers({ users }: { users: User[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
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
          pin: form.get('pin'),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar');
      }

      setShowCreate(false);
      setSuccess('Utilizador criado!');
      e.currentTarget.reset();
      router.refresh();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function updatePin(userId: string) {
    if (newPin.length !== 8 || !/^\d{8}$/.test(newPin)) {
      setError('PIN deve ter 8 dígitos');
      return;
    }
    setLoading(true);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, pin: newPin }),
    });
    setEditingPin(null);
    setNewPin('');
    setLoading(false);
    setSuccess('PIN atualizado!');
    router.refresh();
    setTimeout(() => setSuccess(''), 3000);
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_active: !currentActive }),
    });
    router.refresh();
  }

  function generatePin(): string {
    return String(Math.floor(10000000 + Math.random() * 90000000));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Gestão de Utilizadores</h2>
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
        <form onSubmit={createUser} className="px-6 py-4 bg-blue-50 border-b border-blue-100 grid grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nome completo</label>
            <input name="full_name" required className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="João Silva" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input name="email" type="email" required className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="joao@sier.pt" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Papel</label>
            <select name="role" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">PIN (8 dígitos)</label>
            <div className="flex gap-1">
              <input name="pin" required pattern="[0-9]{8}" maxLength={8} className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" placeholder="12345678" />
              <button type="button" onClick={() => {
                const pin = generatePin();
                const input = document.querySelector('input[name="pin"]') as HTMLInputElement;
                if (input) input.value = pin;
              }} className="rounded bg-gray-200 px-2 py-1 text-xs" title="Gerar PIN">🎲</button>
            </div>
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
              {loading ? '...' : 'Criar'}
            </button>
          </div>
          {error && <p className="col-span-5 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="px-6 py-2 font-medium">Nome</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Papel</th>
            <th className="px-4 py-2 font-medium">PIN</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.filter(u => u.email !== 'admin@sier.pt').map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-2.5 font-medium text-gray-900">{user.full_name}</td>
              <td className="px-4 py-2.5 text-gray-600">{user.email}</td>
              <td className="px-4 py-2.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{user.role}</span>
              </td>
              <td className="px-4 py-2.5">
                {editingPin === user.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                      autoFocus
                      placeholder="8 dígitos"
                    />
                    <button onClick={() => updatePin(user.id)} disabled={loading} className="rounded bg-green-600 px-2 py-1 text-xs text-white">✓</button>
                    <button onClick={() => { setEditingPin(null); setNewPin(''); }} className="text-xs text-gray-400">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-mono">{user.pin_hash ? '••••••••' : 'Sem PIN'}</span>
                    <button onClick={() => { setEditingPin(user.id); setNewPin(''); }} className="text-xs text-blue-600 hover:underline">
                      {user.pin_hash ? 'Alterar' : 'Definir'}
                    </button>
                  </div>
                )}
              </td>
              <td className="px-4 py-2.5">
                <span className={`h-2 w-2 rounded-full inline-block ${user.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="ml-1 text-xs text-gray-500">{user.is_active ? 'Ativo' : 'Inativo'}</span>
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
