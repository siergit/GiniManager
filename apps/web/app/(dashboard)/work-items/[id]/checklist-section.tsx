'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
  id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
}

export default function ChecklistSection({ workItemId, items }: { workItemId: string; items: ChecklistItem[] }) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const completed = items.filter(i => i.is_completed).length;

  async function toggleItem(itemId: string, currentState: boolean) {
    setLoading(itemId);
    try {
      await fetch(`/api/work-items/${workItemId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, is_completed: !currentState }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading('new');
    try {
      await fetch(`/api/work-items/${workItemId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setNewTitle('');
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Checklist</h2>
        <span className="text-sm text-gray-500">{completed}/{items.length} ({pct}%)</span>
      </div>

      {items.length > 0 && (
        <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="mt-3 space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id, item.is_completed)}
            disabled={loading === item.id}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              item.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
            }`}>
              {item.is_completed && <span className="text-xs">✓</span>}
            </div>
            <span className={`text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.title}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={addItem} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add checklist item..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading === 'new' || !newTitle.trim()}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
