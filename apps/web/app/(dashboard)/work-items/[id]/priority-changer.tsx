'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const priorities = [
  { value: 'critical', icon: '🔴', label: 'Critical' },
  { value: 'high', icon: '🟠', label: 'High' },
  { value: 'medium', icon: '🟡', label: 'Medium' },
  { value: 'low', icon: '🔵', label: 'Low' },
  { value: 'none', icon: '⚪', label: 'None' },
];

export default function PriorityChanger({ itemId, currentPriority }: { itemId: string; currentPriority: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = priorities.find(p => p.value === currentPriority) || priorities[2];

  async function change(value: string) {
    setLoading(true);
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: value }),
    });
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1.5 text-2xl hover:opacity-80 transition-opacity"
        title={`Priority: ${current.label}`}
      >
        {current.icon}
        <span className="text-xs text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 rounded-lg border border-gray-200 bg-white shadow-lg p-1 w-36">
          {priorities.map(p => (
            <button
              key={p.value}
              onClick={() => change(p.value)}
              className={`w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-sm hover:bg-gray-100 ${
                p.value === currentPriority ? 'bg-gray-50 font-medium' : ''
              }`}
            >
              <span>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
