'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const typeLabels: Record<string, string> = {
  area: 'Area', project: 'Project', delivery: 'Delivery', task: 'Task', subtask: 'Subtask',
};

interface Props {
  parentItems: { id: string; title: string; item_type: string; depth: number }[];
  users: { id: string; full_name: string; email: string }[];
}

export default function CreateWorkItemForm({ parentItems, users }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const hours = parseFloat(form.get('estimated_hours') as string) || 0;

    const data: Record<string, unknown> = {
      title: form.get('title'),
      description: form.get('description') || null,
      item_type: form.get('item_type'),
      priority: form.get('priority'),
      state: form.get('state'),
      estimated_minutes: Math.round(hours * 60),
      start_date: form.get('start_date') || null,
      due_date: form.get('due_date') || null,
    };

    const parentId = form.get('parent_id') as string;
    if (parentId) data.parent_id = parentId;

    const assigneeId = form.get('assignee_id') as string;
    if (assigneeId) data.assignee_id = assigneeId;

    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create');
      }

      const result = await res.json();
      router.push(`/work-items/${result.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title *</label>
        <input id="title" name="title" type="text" required className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Upgrade 7m USS" />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="description" name="description" rows={3} className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500" placeholder="Describe the work item..." />
      </div>

      <div>
        <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">Parent Item</label>
        <select id="parent_id" name="parent_id" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5">
          <option value="">None (top-level area)</option>
          {parentItems.map((p) => (
            <option key={p.id} value={p.id}>
              {'  '.repeat(p.depth)}{typeLabels[p.item_type] || p.item_type}: {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="item_type" className="block text-sm font-medium text-gray-700">Type *</label>
          <select id="item_type" name="item_type" required className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5">
            {['area', 'project', 'delivery', 'task', 'subtask'].map(t => (
              <option key={t} value={t}>{typeLabels[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
          <select id="priority" name="priority" defaultValue="medium" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5">
            {['critical', 'high', 'medium', 'low', 'none'].map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
          <select id="state" name="state" defaultValue="backlog" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5">
            {['backlog', 'ready', 'planned', 'in_progress'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="assignee_id" className="block text-sm font-medium text-gray-700">Assignee</label>
          <select id="assignee_id" name="assignee_id" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5">
            <option value="">Unassigned</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700">Estimated (hours)</label>
          <input id="estimated_hours" name="estimated_hours" type="number" min="0" max="1000" step="0.5" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5" placeholder="0" />
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
          <input id="due_date" name="due_date" type="date" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5" />
        </div>
      </div>

      <div>
        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
        <input id="start_date" name="start_date" type="date" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Creating...' : 'Create Work Item'}
        </button>
      </div>
    </form>
  );
}
