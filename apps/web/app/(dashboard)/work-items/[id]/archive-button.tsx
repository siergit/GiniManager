'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ArchiveButton({ itemId, isArchived }: { itemId: string; isArchived: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: isArchived ? 'backlog' : 'archived' }),
    });
    setLoading(false);
    if (!isArchived) {
      router.push('/work-items');
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : isArchived ? '📤 Restaurar' : '📥 Arquivar'}
    </button>
  );
}
