'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ReorderButtons({ itemId, currentOrder, siblingCount }: { itemId: string; currentOrder: number; siblingCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function move(direction: 'up' | 'down') {
    setLoading(true);
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sort_order: newOrder }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-0.5">
      <button
        onClick={(e) => { e.preventDefault(); move('up'); }}
        disabled={loading || currentOrder <= 0}
        className="rounded px-1 py-0.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default"
        title="Move up"
      >
        ▲
      </button>
      <button
        onClick={(e) => { e.preventDefault(); move('down'); }}
        disabled={loading || currentOrder >= siblingCount - 1}
        className="rounded px-1 py-0.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default"
        title="Move down"
      >
        ▼
      </button>
    </div>
  );
}
