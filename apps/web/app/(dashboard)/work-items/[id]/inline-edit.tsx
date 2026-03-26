'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  itemId: string;
  field: string;
  value: string | number | null;
  type?: 'text' | 'date' | 'number' | 'select';
  options?: { value: string; label: string }[];
  label: string;
  suffix?: string;
  displayValue?: string;
}

export default function InlineEdit({ itemId, field, value, type = 'text', options, label, suffix, displayValue }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentValue, setCurrentValue] = useState(value?.toString() || '');

  async function save() {
    setSaving(true);
    try {
      let apiValue: string | number | null = currentValue;
      if (type === 'number') apiValue = currentValue ? Number(currentValue) : 0;
      if (currentValue === '' && type === 'date') apiValue = null;

      await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: apiValue }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') { setEditing(false); setCurrentValue(value?.toString() || ''); }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full text-left group"
        title={`Edit ${label}`}
      >
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {displayValue || value?.toString() || '—'}
          {suffix && value ? ` ${suffix}` : ''}
          <span className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
        </p>
      </button>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="mt-1 flex gap-1">
        {type === 'select' && options ? (
          <select
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); }}
            onBlur={save}
            autoFocus
            className="flex-1 rounded border border-blue-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
          >
            <option value="">None</option>
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            autoFocus
            className="flex-1 rounded border border-blue-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 w-full"
          />
        )}
        {saving && <span className="text-xs text-gray-400 self-center">...</span>}
      </div>
    </div>
  );
}
