'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  itemId: string;
  currentParentId: string | null;
  itemType: string;
}

const validParents: Record<string, string[]> = {
  project: ['area'],
  delivery: ['project'],
  task: ['delivery', 'project'],
  subtask: ['task'],
};

export default function MoveItem({ itemId, currentParentId, itemType }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ id: string; title: string; item_type: string }[]>([]);
  const [targetId, setTargetId] = useState(currentParentId || '');

  useEffect(() => {
    if (open) {
      fetch('/api/work-items?limit=500')
        .then(r => r.json())
        .then(d => setItems(d.data || []));
    }
  }, [open]);

  const allowedTypes = validParents[itemType] || [];
  const options = items.filter(i => allowedTypes.includes(i.item_type) && i.id !== itemId);

  async function handleMove() {
    if (!targetId || targetId === currentParentId) return;
    setLoading(true);
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: targetId }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
        Mover
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={targetId}
        onChange={e => setTargetId(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-xs max-w-[200px]"
      >
        <option value="">Selecionar destino...</option>
        {options.map(i => (
          <option key={i.id} value={i.id}>[{i.item_type}] {i.title}</option>
        ))}
      </select>
      <button onClick={handleMove} disabled={loading || !targetId} className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50">
        {loading ? '...' : 'Mover'}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400">&#x2715;</button>
    </div>
  );
}
