'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATE_TRANSITIONS: Record<string, string[]> = {
  backlog: ['ready', 'planned', 'cancelled', 'deferred'],
  ready: ['planned', 'in_progress', 'cancelled', 'deferred', 'backlog'],
  planned: ['in_progress', 'blocked', 'cancelled', 'deferred', 'backlog'],
  in_progress: ['in_review', 'blocked', 'on_hold', 'done', 'cancelled', 'failed'],
  in_review: ['waiting_approval', 'in_progress', 'blocked', 'done', 'failed'],
  waiting_approval: ['approved', 'in_progress', 'in_review', 'blocked'],
  approved: ['done', 'in_progress'],
  blocked: ['in_progress', 'ready', 'planned', 'cancelled', 'on_hold'],
  on_hold: ['in_progress', 'ready', 'cancelled', 'backlog'],
  cancelled: ['backlog', 'reopened'],
  done: ['reopened'],
  archived: ['reopened'],
  reopened: ['in_progress', 'ready', 'planned', 'backlog'],
  deferred: ['backlog', 'ready', 'planned', 'cancelled'],
  failed: ['in_progress', 'backlog', 'cancelled'],
};

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  ready: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  planned: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  in_progress: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  in_review: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  waiting_approval: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  approved: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  blocked: 'bg-red-100 text-red-700 hover:bg-red-200',
  on_hold: 'bg-gray-200 text-gray-600 hover:bg-gray-300',
  done: 'bg-green-100 text-green-700 hover:bg-green-200',
  cancelled: 'bg-gray-100 text-gray-400 hover:bg-gray-200',
  archived: 'bg-gray-50 text-gray-400 hover:bg-gray-100',
  reopened: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  deferred: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  failed: 'bg-red-200 text-red-800 hover:bg-red-300',
};

export default function StateChanger({ itemId, currentState }: { itemId: string; currentState: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [reason, setReason] = useState('');
  const [pendingState, setPendingState] = useState<string | null>(null);

  const validTransitions = STATE_TRANSITIONS[currentState] || [];

  async function changeState(newState: string) {
    if (newState === 'blocked' && !reason) {
      setPendingState(newState);
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { state: newState };
      if (newState === 'blocked' && reason) body.blocked_reason = reason;

      const res = await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowOptions(false);
        setPendingState(null);
        setReason('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${stateColors[currentState] || 'bg-gray-100 text-gray-700'}`}
      >
        {loading ? 'Updating...' : currentState.replace(/_/g, ' ')} ▾
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg p-2">
          <p className="px-2 py-1 text-xs text-gray-400 uppercase tracking-wide">Change state to:</p>
          {validTransitions.map((state) => (
            <button
              key={state}
              onClick={() => changeState(state)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${stateColors[state] || 'bg-gray-100 text-gray-700'} mb-1`}
            >
              {state.replace(/_/g, ' ')}
            </button>
          ))}
          {validTransitions.length === 0 && (
            <p className="px-2 py-2 text-sm text-gray-400">No valid transitions</p>
          )}
          <button
            onClick={() => setShowOptions(false)}
            className="w-full text-left rounded-lg px-3 py-2 text-xs text-gray-400 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}

      {pendingState === 'blocked' && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-lg p-4">
          <p className="text-sm font-medium text-gray-900">Reason for blocking?</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={2}
            placeholder="Enter reason..."
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => changeState('blocked')}
              disabled={!reason}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              Block
            </button>
            <button
              onClick={() => { setPendingState(null); setReason(''); }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
