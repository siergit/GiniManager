'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from './theme-provider';
import { useLocale } from './locale-provider';

const navItems = [
  { href: '/', labelKey: 'nav.dashboard' as const, icon: '📊' },
  { href: '/my-work', labelKey: 'nav.myWork' as const, icon: '👤' },
  { href: '/work-items', labelKey: 'nav.workItems' as const, icon: '📋' },
  { href: '/time-tracking', labelKey: 'nav.timeTracking' as const, icon: '⏱️' },
  { href: '/team', labelKey: 'nav.team' as const, icon: '👥' },
  { href: '/capacity', labelKey: 'nav.calendar' as const, icon: '📅' },
  { href: '/reports', labelKey: 'nav.reports' as const, icon: '📈' },
  { href: '/notifications', labelKey: 'nav.notifications' as const, icon: '🔔' },
  { href: '/settings', labelKey: 'nav.settings' as const, icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggle } = useTheme();
  const { t } = useLocale();

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
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={toggle}
            className="w-full mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
            {theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
          </button>
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
              {loggingOut ? '...' : `↪ ${t('common.logout')}`}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
