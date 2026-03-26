'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/work-items', label: 'Work Items', icon: '📋' },
  { href: '/time-tracking', label: 'Time Tracking', icon: '⏱️' },
  { href: '/team', label: 'Team', icon: '👥' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">Gini</span>
            <span className="text-xl font-bold text-gray-900">Manager</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">SIER</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              {loggingOut ? '...' : '↪ Sair'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
