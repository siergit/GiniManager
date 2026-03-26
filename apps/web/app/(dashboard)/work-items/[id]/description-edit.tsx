'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DescriptionEdit({ itemId, description }: { itemId: string; description: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(description || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: value.trim() || null }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="mt-1">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setValue(description || ''); } }}
          autoFocus
          rows={3}
          className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:ring-blue-500"
          placeholder="Add a description..."
        />
        <div className="mt-1 flex gap-2">
          <button onClick={save} disabled={saving} className="rounded bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50">
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={() => { setEditing(false); setValue(description || ''); }} className="rounded border border-gray-300 px-3 py-1 text-xs">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className="mt-1 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
      title="Click to edit description"
    >
      {description || <span className="text-gray-400 italic">Click to add description...</span>}
    </p>
  );
}
