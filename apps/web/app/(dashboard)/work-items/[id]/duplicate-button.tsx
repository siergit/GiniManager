'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DuplicateButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    try {
      // Fetch original
      const res = await fetch(`/api/work-items/${itemId}`);
      const { data: original } = await res.json();

      if (!original) return;

      // Create duplicate
      const dupRes = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${original.title} (cópia)`,
          description: original.description,
          item_type: original.item_type,
          parent_id: original.parent_id,
          priority: original.priority,
          state: 'backlog',
          estimated_minutes: original.estimated_minutes,
          assignee_id: original.assignee_id,
          team_id: original.team_id,
          start_date: original.start_date,
          due_date: original.due_date,
          tags: original.tags,
        }),
      });

      const { data: newItem } = await dupRes.json();
      if (newItem?.id) {
        router.push(`/work-items/${newItem.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
    >
      {loading ? 'A duplicar...' : 'Duplicar'}
    </button>
  );
}
