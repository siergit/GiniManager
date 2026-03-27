'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const presets = [
    { label: '7 dias', value: '7' },
    { label: '30 dias', value: '30' },
    { label: '90 dias', value: '90' },
    { label: 'Este m\u00eas', value: 'month' },
    { label: 'Este ano', value: 'year' },
  ];

  function applyPreset(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const now = new Date();
    let from: string;

    if (value === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (value === 'year') {
      from = `${now.getFullYear()}-01-01`;
    } else {
      const d = new Date();
      d.setDate(d.getDate() - parseInt(value));
      from = d.toISOString().split('T')[0];
    }

    params.set('from', from);
    params.set('to', now.toISOString().split('T')[0]);
    router.push(`/reports?${params.toString()}`);
  }

  function applyCustom(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/reports?${params.toString()}`);
  }

  const current = searchParams.get('from');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(p => {
        const isActive = current && (() => {
          const now = new Date();
          const d = new Date();
          if (p.value === 'month') return current === new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          if (p.value === 'year') return current === `${now.getFullYear()}-01-01`;
          d.setDate(d.getDate() - parseInt(p.value));
          return current === d.toISOString().split('T')[0];
        })();

        return (
          <button
            key={p.value}
            onClick={() => applyPreset(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        );
      })}
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={searchParams.get('from') || ''}
          onChange={e => applyCustom('from', e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-xs"
        />
        <span className="text-gray-400 text-xs">&mdash;</span>
        <input
          type="date"
          value={searchParams.get('to') || ''}
          onChange={e => applyCustom('to', e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
}
