'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const depTypeLabels: Record<string, string> = {
  finish_to_start: 'Finish \u2192 Start',
  start_to_start: 'Start \u2192 Start',
  finish_to_finish: 'Finish \u2192 Finish',
  approval: 'Approval',
  colleague: 'Colleague',
  external_entity: 'External',
  date_milestone: 'Date/Milestone',
};

const stateColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

interface Dep {
  id: string;
  dependency_type: string;
  status: string;
  notes: string | null;
  target?: { id: string; title: string; state: string; item_type: string } | null;
  source?: { id: string; title: string; state: string; item_type: string } | null;
}

export default function DependenciesSection({
  workItemId,
  allItems,
}: {
  workItemId: string;
  allItems: { id: string; title: string; item_type: string }[];
}) {
  const router = useRouter();
  const [dependsOn, setDependsOn] = useState<Dep[]>([]);
  const [dependedBy, setDependedBy] = useState<Dep[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState('');
  const [depType, setDepType] = useState('finish_to_start');

  useEffect(() => {
    fetch(`/api/work-items/${workItemId}/dependencies`)
      .then(r => r.json())
      .then(data => {
        setDependsOn(data.dependsOn || []);
        setDependedBy(data.dependedBy || []);
        setLoading(false);
      });
  }, [workItemId]);

  async function addDependency() {
    if (!targetId) return;
    await fetch(`/api/work-items/${workItemId}/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depends_on_work_item_id: targetId, dependency_type: depType }),
    });
    setShowAdd(false);
    setTargetId('');
    router.refresh();
    // Refetch
    const r = await fetch(`/api/work-items/${workItemId}/dependencies`);
    const data = await r.json();
    setDependsOn(data.dependsOn || []);
    setDependedBy(data.dependedBy || []);
  }

  async function removeDep(depId: string) {
    await fetch(`/api/work-items/${workItemId}/dependencies?dep_id=${depId}`, { method: 'DELETE' });
    setDependsOn(prev => prev.filter(d => d.id !== depId));
    setDependedBy(prev => prev.filter(d => d.id !== depId));
  }

  if (loading) return <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-gray-400 text-sm">Loading dependencies...</div>;

  const total = dependsOn.length + dependedBy.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Dependencies ({total})</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="text-sm text-blue-600 hover:text-blue-800">
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
              <option value="">Select item...</option>
              {allItems.filter(i => i.id !== workItemId).map(i => (
                <option key={i.id} value={i.id}>[{i.item_type}] {i.title}</option>
              ))}
            </select>
            <select value={depType} onChange={e => setDepType(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
              {Object.entries(depTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button onClick={addDependency} disabled={!targetId} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            Add Dependency
          </button>
        </div>
      )}

      {dependsOn.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Depends on:</p>
          <div className="space-y-2">
            {dependsOn.map(dep => (
              <div key={dep.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400">{depTypeLabels[dep.dependency_type] || dep.dependency_type}</span>
                <span className="text-gray-300">&rarr;</span>
                {dep.target ? (
                  <Link href={`/work-items/${dep.target.id}`} className="text-blue-600 hover:underline">{dep.target.title}</Link>
                ) : <span className="text-gray-400">Unknown</span>}
                {dep.target && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[dep.target.state] || 'bg-gray-100 text-gray-600'}`}>
                    {dep.target.state.replace(/_/g, ' ')}
                  </span>
                )}
                <span className={`rounded px-1.5 py-0.5 text-xs ${dep.status === 'satisfied' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {dep.status}
                </span>
                <button onClick={() => removeDep(dep.id)} className="ml-auto text-xs text-gray-300 hover:text-red-500">&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {dependedBy.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Blocks:</p>
          <div className="space-y-2">
            {dependedBy.map(dep => (
              <div key={dep.id} className="flex items-center gap-2 text-sm">
                {dep.source ? (
                  <Link href={`/work-items/${dep.source.id}`} className="text-blue-600 hover:underline">{dep.source.title}</Link>
                ) : <span className="text-gray-400">Unknown</span>}
                <span className="text-gray-300">&rarr;</span>
                <span className="text-xs text-gray-400">{depTypeLabels[dep.dependency_type] || dep.dependency_type}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs ${dep.status === 'satisfied' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {dep.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && !showAdd && (
        <p className="mt-3 text-sm text-gray-400">No dependencies. Click &quot;+ Add&quot; to create one.</p>
      )}
    </div>
  );
}
