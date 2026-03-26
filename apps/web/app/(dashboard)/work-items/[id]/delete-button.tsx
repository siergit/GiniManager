'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ itemId, itemTitle }: { itemId: string; itemTitle: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/work-items');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-600">Delete &quot;{itemTitle}&quot;?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Yes, delete'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600"
      >
        Cancel
      </button>
    </div>
  );
}
