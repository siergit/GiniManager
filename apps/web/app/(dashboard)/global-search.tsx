'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const priorityIcons: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪',
};

const typeColors: Record<string, string> = {
  area: 'bg-indigo-100 text-indigo-700',
  project: 'bg-blue-100 text-blue-700',
  delivery: 'bg-cyan-100 text-cyan-700',
  task: 'bg-emerald-100 text-emerald-700',
  subtask: 'bg-gray-100 text-gray-600',
};

interface SearchResults {
  items: { id: string; title: string; item_type: string; state: string; priority: string }[];
  comments: { id: string; body: string; work_item_id: string; user: { full_name: string } | null }[];
  users: { id: string; full_name: string; email: string; role: string }[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (value.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  const total = results ? results.items.length + results.comments.length + results.users.length : 0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Pesquisar tarefas, comentários, pessoas..."
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">...</span>}
      </div>

      {open && results && total > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-gray-200 bg-white shadow-xl max-h-96 overflow-y-auto">
          {/* Work Items */}
          {results.items.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                Itens ({results.items.length})
              </div>
              {results.items.map(item => (
                <Link
                  key={item.id}
                  href={`/work-items/${item.id}`}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-sm">{priorityIcons[item.priority] || '⚪'}</span>
                  <span className="flex-1 text-sm text-gray-900 truncate">{item.title}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${typeColors[item.item_type] || ''}`}>
                    {item.item_type}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Comments */}
          {results.comments.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                Comentários ({results.comments.length})
              </div>
              {results.comments.map(c => (
                <Link
                  key={c.id}
                  href={`/work-items/${c.work_item_id}`}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-sm">💬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{c.body}</p>
                    <p className="text-xs text-gray-400">{c.user?.full_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                Pessoas ({results.users.length})
              </div>
              {results.users.map(u => (
                <Link
                  key={u.id}
                  href="/team"
                  onClick={() => { setOpen(false); setQuery(''); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-sm">👤</span>
                  <div>
                    <p className="text-sm text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {open && results && total === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-gray-200 bg-white shadow-xl p-4 text-center text-sm text-gray-400">
          Sem resultados para &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
