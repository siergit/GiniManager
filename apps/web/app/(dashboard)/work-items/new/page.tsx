'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const itemTypes = ['area', 'project', 'delivery', 'task', 'subtask'];
const priorities = ['critical', 'high', 'medium', 'low', 'none'];
const states = ['backlog', 'ready', 'planned', 'in_progress'];

export default function NewWorkItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      item_type: formData.get('item_type'),
      priority: formData.get('priority'),
      state: formData.get('state'),
      estimated_minutes: Number(formData.get('estimated_hours')) * 60 || 0,
      start_date: formData.get('start_date') || null,
      due_date: formData.get('due_date') || null,
    };

    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push('/work-items');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Work Item</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new area, project, task, or subtask</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g. Upgrade 7m USS"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe the work item..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="item_type" className="block text-sm font-medium text-gray-700">
              Type *
            </label>
            <select
              id="item_type"
              name="item_type"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              {itemTypes.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <select
              id="state"
              name="state"
              defaultValue="backlog"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700">
              Estimated (hours)
            </label>
            <input
              id="estimated_hours"
              name="estimated_hours"
              type="number"
              min="0"
              step="0.5"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5"
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Work Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
