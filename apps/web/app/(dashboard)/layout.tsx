import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/work-items', label: 'Work Items', icon: '📋' },
  { href: '/time-tracking', label: 'Time Tracking', icon: '⏱️' },
  { href: '/team', label: 'Team', icon: '👥' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('gini-admin-session');

  if (!adminSession || adminSession.value !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
            <span className="text-xl font-bold text-blue-600">Gini</span>
            <span className="text-xl font-bold text-gray-900">Manager</span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
              <div>
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">admin@sier.pt</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-lg font-bold text-blue-600">Gini</span>
            <span className="text-lg font-bold text-gray-900">Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">SIER - UnikRobotics / MACH4</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
