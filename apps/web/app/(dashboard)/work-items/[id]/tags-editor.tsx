'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const tagColors = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return tagColors[Math.abs(hash) % tagColors.length];
}

export default function TagsEditor({ itemId, tags }: { itemId: string; tags: string[] }) {
  const router = useRouter();
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setLoading(true);
    const updated = [...tags, newTag.trim()];
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: updated }),
    });
    setNewTag('');
    setLoading(false);
    router.refresh();
  }

  async function removeTag(tag: string) {
    setLoading(true);
    const updated = tags.filter(t => t !== tag);
    await fetch(`/api/work-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: updated }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map(tag => (
        <span key={tag} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagColor(tag)}`}>
          {tag}
          <button onClick={() => removeTag(tag)} className="hover:opacity-60" disabled={loading}>✕</button>
        </span>
      ))}
      <form onSubmit={addTag} className="inline-flex">
        <input
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          placeholder="+ tag"
          className="w-16 rounded border-0 bg-transparent px-1 py-0.5 text-xs text-gray-500 placeholder-gray-300 focus:w-24 focus:ring-0 focus:outline-none transition-all"
        />
      </form>
    </div>
  );
}
