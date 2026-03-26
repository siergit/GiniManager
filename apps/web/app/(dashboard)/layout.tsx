import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from './sidebar';
import MobileHeader from './mobile-header';
import { ThemeProvider } from './theme-provider';

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
    <ThemeProvider>
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <header className="hidden md:flex h-16 items-center justify-end border-b border-gray-200 bg-white px-6 dark:bg-gray-800 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">SIER - UnikRobotics / MACH4</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}
