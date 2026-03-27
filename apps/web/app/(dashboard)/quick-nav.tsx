'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  'work-items': 'Work Items',
  'kanban': 'Kanban',
  'new': 'Novo',
  'time-tracking': 'Time Tracking',
  'approvals': 'Aprovações',
  'team': 'Equipa',
  'capacity': 'Calendário',
  'reports': 'Relatórios',
  'weekly': 'Semanal',
  'notifications': 'Notificações',
  'settings': 'Definições',
  'my-work': 'Visão Pessoa',
};

export default function QuickNav() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4 no-print">
      <Link href="/" className="hover:text-blue-600">Dashboard</Link>
      {parts.map((part, i) => {
        const href = '/' + parts.slice(0, i + 1).join('/');
        const label = pathLabels[part] || part;
        const isLast = i === parts.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            <span className="text-gray-300">/</span>
            {isLast ? (
              <span className="text-gray-600 dark:text-gray-300">{label}</span>
            ) : (
              <Link href={href} className="hover:text-blue-600">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
