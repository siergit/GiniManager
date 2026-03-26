'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApprovalActions({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action);
    await fetch(`/api/time-entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: new Date().toISOString(),
      }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="rounded bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === 'approve' ? '...' : '✓ Aprovar'}
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="rounded bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
      >
        {loading === 'reject' ? '...' : '✕ Rejeitar'}
      </button>
    </div>
  );
}
