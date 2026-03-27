'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      // CMD/CTRL + K = Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Pesquisar"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
        return;
      }

      // No modifier keys for single-key shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'g':
          // g then d = dashboard, g then w = work items, etc.
          // For simplicity, use single keys
          break;
        case 'd':
          router.push('/');
          break;
        case 'w':
          router.push('/work-items');
          break;
        case 'k':
          router.push('/work-items/kanban');
          break;
        case 't':
          router.push('/time-tracking');
          break;
        case 'n':
          router.push('/work-items/new');
          break;
        case 'p':
          router.push('/my-work');
          break;
        case 'r':
          router.push('/reports');
          break;
        case '?':
          // Show shortcuts modal
          const modal = document.getElementById('shortcuts-modal');
          if (modal) modal.classList.toggle('hidden');
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div id="shortcuts-modal" className="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={(e) => {
      if (e.target === e.currentTarget) (e.target as HTMLElement).classList.add('hidden');
    }}>
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Atalhos de Teclado</h2>
        <div className="mt-4 space-y-2">
          {[
            ['⌘K / Ctrl+K', 'Pesquisar'],
            ['D', 'Dashboard'],
            ['W', 'Work Items'],
            ['K', 'Kanban'],
            ['T', 'Time Tracking'],
            ['N', 'Novo Item'],
            ['P', 'Visão Pessoa'],
            ['R', 'Relatórios'],
            ['?', 'Mostrar/esconder atalhos'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">{desc}</span>
              <kbd className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400">Pressiona ? para fechar</p>
      </div>
    </div>
  );
}
