'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TitleEdit({ itemId, title }: { itemId: string; title: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (value.trim() === title) { setEditing(false); return; }
    setSaving(true);
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: value.trim() }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setValue(title); } }}
        autoFocus
        className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent w-full"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors group"
      title="Click to edit"
    >
      {title}
      <span className="ml-2 text-gray-300 opacity-0 group-hover:opacity-100 text-base">✎</span>
    </h1>
  );
}
