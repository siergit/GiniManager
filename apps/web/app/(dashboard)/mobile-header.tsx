'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/my-work', label: 'Visão Pessoa', icon: '👤' },
  { href: '/work-items', label: 'Work Items', icon: '📋' },
  { href: '/time-tracking', label: 'Time', icon: '⏱️' },
  { href: '/team', label: 'Team', icon: '👥' },
  { href: '/capacity', label: 'Calendário', icon: '📅' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/notifications', label: 'Alerts', icon: '🔔' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <button onClick={() => setOpen(!open)} className="text-xl">
          {open ? '✕' : '☰'}
        </button>
        <Link href="/" className="flex items-center gap-1">
          <span className="text-lg font-bold text-blue-600">Gini</span>
          <span className="text-lg font-bold text-gray-900">Manager</span>
        </Link>
        <div className="w-6" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <nav className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl p-4 space-y-1">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-200 mb-2">
              <span className="text-xl font-bold text-blue-600">Gini</span>
              <span className="text-xl font-bold text-gray-900">Manager</span>
            </div>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full">
                ↪ Sair
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
