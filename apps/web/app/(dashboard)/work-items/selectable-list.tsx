'use client';

import { useState } from 'react';
import Link from 'next/link';
import BulkActions from './bulk-actions';

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const typeColors: Record<string, string> = {
  area: 'bg-indigo-600', project: 'bg-blue-600', delivery: 'bg-cyan-600', task: 'bg-emerald-600', subtask: 'bg-gray-500',
};

interface Item {
  id: string;
  title: string;
  item_type: string;
  state: string;
  priority: string;
}

export default function SelectableList({ items, searchTerm }: { items: Item[]; searchTerm?: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  }

  return (
    <>
      <BulkActions selectedIds={[...selected]} onClear={() => setSelected(new Set())} />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected.size === items.length && items.length > 0}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300"
          />
          <h2 className="text-sm font-medium text-gray-700">
            {items.length} resultados {searchTerm && `para "${searchTerm}"`}
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Link href={`/work-items/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <span>{priorityIcons[item.priority] || '⚪'}</span>
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">{item.title}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium text-white ${typeColors[item.item_type] || 'bg-gray-500'}`}>
                  {item.item_type}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[item.state] || 'bg-gray-100 text-gray-700'}`}>
                  {item.state.replace(/_/g, ' ')}
                </span>
              </Link>
            </div>
          ))}
          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Sem resultados</div>
          )}
        </div>
      </div>
    </>
  );
}
