'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function WorkItemFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(d.data || []));
  }, []);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/work-items?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilter('search', search);
  }

  function clearAll() {
    setSearch('');
    router.push('/work-items');
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={handleSearch} className="flex gap-1">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button type="submit" className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">
          🔍
        </button>
      </form>
      <select
        value={searchParams.get('state') || ''}
        onChange={e => applyFilter('state', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Estado</option>
        <option value="backlog">Backlog</option>
        <option value="in_progress">Em progresso</option>
        <option value="blocked">Bloqueado</option>
        <option value="done">Concluído</option>
        <option value="planned">Planeado</option>
        <option value="in_review">Em revisão</option>
      </select>
      <select
        value={searchParams.get('priority') || ''}
        onChange={e => applyFilter('priority', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Prioridade</option>
        <option value="critical">🔴 Crítica</option>
        <option value="high">🟠 Alta</option>
        <option value="medium">🟡 Média</option>
        <option value="low">🔵 Baixa</option>
      </select>
      <select
        value={searchParams.get('type') || ''}
        onChange={e => applyFilter('type', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Tipo</option>
        <option value="area">Área</option>
        <option value="project">Projeto</option>
        <option value="delivery">Entrega</option>
        <option value="task">Tarefa</option>
      </select>
      <select
        value={searchParams.get('assignee') || ''}
        onChange={e => applyFilter('assignee', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Responsável</option>
        <option value="unassigned">Sem atribuição</option>
        {users.filter(u => u.full_name !== 'Admin SIER').map(u => (
          <option key={u.id} value={u.id}>{u.full_name}</option>
        ))}
      </select>
      {hasFilters && (
        <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500">
          ✕ Limpar
        </button>
      )}
    </div>
  );
}
