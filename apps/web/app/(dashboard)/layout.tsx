import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from './sidebar';

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
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-lg font-bold text-blue-600">Gini</span>
            <span className="text-lg font-bold text-gray-900">Manager</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
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
