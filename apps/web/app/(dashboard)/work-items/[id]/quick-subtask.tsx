'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  parentId: string;
  parentType: string;
  users: { id: string; full_name: string }[];
}

const childTypes: Record<string, string> = {
  area: 'project',
  project: 'delivery',
  delivery: 'task',
  task: 'subtask',
  subtask: 'subtask',
};

export default function QuickSubtask({ parentId, parentType, users }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  const childType = childTypes[parentType] || 'task';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          parent_id: parentId,
          item_type: childType,
          priority: form.get('priority') || 'medium',
          state: 'backlog',
          assignee_id: form.get('assignee_id') || null,
          estimated_minutes: Number(form.get('hours') || 0) * 60,
        }),
      });

      if (res.ok) {
        setTitle('');
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        + Criar {childType} rápido
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={`Título do ${childType}...`}
          autoFocus
          className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select name="priority" defaultValue="medium" className="rounded border border-gray-300 px-2 py-1.5 text-sm w-24">
          <option value="critical">🔴 Crítica</option>
          <option value="high">🟠 Alta</option>
          <option value="medium">🟡 Média</option>
          <option value="low">🔵 Baixa</option>
        </select>
      </div>
      <div className="flex gap-2">
        <select name="assignee_id" className="rounded border border-gray-300 px-2 py-1.5 text-sm flex-1">
          <option value="">Sem responsável</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
        <input type="number" name="hours" min="0" max="100" step="0.5" placeholder="h est." className="rounded border border-gray-300 px-2 py-1.5 text-sm w-20" />
        <button type="submit" disabled={loading || !title.trim()} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          {loading ? '...' : 'Criar'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setTitle(''); }} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          ✕
        </button>
      </div>
    </form>
  );
}
