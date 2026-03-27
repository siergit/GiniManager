'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

interface Props {
  workItemId: string;
  workItemTitle: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function PlayButton({ workItemId, workItemTitle, size = 'sm', showLabel = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startTimer() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: DEFAULT_USER_ID, work_item_id: workItemId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start timer');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  const btnClass = size === 'md'
    ? 'rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors'
    : 'rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors';

  return (
    <div className="inline-flex items-center gap-1">
      <button onClick={startTimer} disabled={loading} className={btnClass} title={`Iniciar timer: ${workItemTitle}`}>
        {loading ? '...' : showLabel ? 'Iniciar Timer' : 'Play'}
      </button>
      {error && <span className="text-[10px] text-red-500 max-w-[150px] truncate">{error}</span>}
    </div>
  );
}
