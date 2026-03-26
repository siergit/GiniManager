'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function WorkItemFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/work-items?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilter('search', search);
  }

  function clearAll() {
    setSearch('');
    router.push('/work-items');
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={handleSearch} className="flex gap-1">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search titles..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-48 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button type="submit" className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">
          Search
        </button>
      </form>
      <select
        value={searchParams.get('state') || ''}
        onChange={e => applyFilter('state', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">All States</option>
        <option value="backlog">Backlog</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
        <option value="planned">Planned</option>
      </select>
      <select
        value={searchParams.get('priority') || ''}
        onChange={e => applyFilter('priority', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">All Priorities</option>
        <option value="critical">🔴 Critical</option>
        <option value="high">🟠 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🔵 Low</option>
      </select>
      <select
        value={searchParams.get('type') || ''}
        onChange={e => applyFilter('type', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">All Types</option>
        <option value="area">Area</option>
        <option value="project">Project</option>
        <option value="delivery">Delivery</option>
        <option value="task">Task</option>
      </select>
      {hasFilters && (
        <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500">
          Clear filters
        </button>
      )}
    </div>
  );
}
