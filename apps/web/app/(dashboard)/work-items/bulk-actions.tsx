'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const states = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'done', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function BulkActions({ selectedIds, onClear }: { selectedIds: string[]; onClear: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function bulkChangeState(newState: string) {
    setLoading(true);
    await Promise.all(
      selectedIds.map(id =>
        fetch(`/api/work-items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: newState }),
        })
      )
    );
    setLoading(false);
    onClear();
    router.refresh();
  }

  async function bulkDelete() {
    if (!confirm(`Eliminar ${selectedIds.length} items?`)) return;
    setLoading(true);
    await Promise.all(
      selectedIds.map(id => fetch(`/api/work-items/${id}`, { method: 'DELETE' }))
    );
    setLoading(false);
    onClear();
    router.refresh();
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-2.5 text-white shadow-lg">
      <span className="text-sm font-medium">{selectedIds.length} selecionado(s)</span>
      <div className="flex gap-1.5">
        {states.map(s => (
          <button
            key={s.value}
            onClick={() => bulkChangeState(s.value)}
            disabled={loading}
            className="rounded bg-white/20 px-2.5 py-1 text-xs font-medium hover:bg-white/30 disabled:opacity-50"
          >
            → {s.label}
          </button>
        ))}
      </div>
      <button
        onClick={bulkDelete}
        disabled={loading}
        className="rounded bg-red-500 px-2.5 py-1 text-xs font-medium hover:bg-red-600 disabled:opacity-50"
      >
        Eliminar
      </button>
      <button onClick={onClear} className="ml-auto text-xs hover:underline">
        Cancelar
      </button>
    </div>
  );
}
