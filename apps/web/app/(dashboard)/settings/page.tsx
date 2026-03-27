import { createAdminClient } from '@/lib/supabase-admin';
import LanguageSwitcher from './language-switcher';
import ManageUsers from './manage-users';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('full_name');

  const { count: itemCount } = await supabase
    .from('work_items')
    .select('*', { count: 'exact', head: true });

  const { count: entryCount } = await supabase
    .from('time_entries')
    .select('*', { count: 'exact', head: true });

  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Application configuration and system info</p>
      </div>

      {/* Language */}
      <LanguageSwitcher />

      {/* System Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">System Info</h2>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Users</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{users?.length || 0}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Work Items</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{itemCount || 0}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Time Entries</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{entryCount || 0}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Comments</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{commentCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Database */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Database</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Provider</span>
            <span className="text-gray-900 font-medium">Supabase (PostgreSQL 17)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Region</span>
            <span className="text-gray-900 font-medium">EU West (Ireland)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Project</span>
            <span className="text-gray-900 font-medium">GiniManager (regmnsqlanryicspccnn)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Tables</span>
            <span className="text-gray-900 font-medium">21 with RLS enabled</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Hosting</span>
            <span className="text-gray-900 font-medium">Vercel (Next.js 15)</span>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <ManageUsers users={users || []} />

      {/* State Machine */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Work Item States</h2>
        <p className="mt-1 text-xs text-gray-500">15 states with validated transitions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['backlog', 'ready', 'planned', 'in_progress', 'in_review', 'waiting_approval', 'approved', 'blocked', 'on_hold', 'done', 'cancelled', 'archived', 'reopened', 'deferred', 'failed'].map(state => {
            const colors: Record<string, string> = {
              backlog: 'bg-gray-100 text-gray-700', ready: 'bg-blue-100 text-blue-700',
              planned: 'bg-purple-100 text-purple-700', in_progress: 'bg-yellow-100 text-yellow-800',
              in_review: 'bg-indigo-100 text-indigo-700', waiting_approval: 'bg-orange-100 text-orange-700',
              approved: 'bg-teal-100 text-teal-700', blocked: 'bg-red-100 text-red-700',
              on_hold: 'bg-gray-200 text-gray-600', done: 'bg-green-100 text-green-700',
              cancelled: 'bg-gray-100 text-gray-400', archived: 'bg-gray-50 text-gray-400',
              reopened: 'bg-amber-100 text-amber-700', deferred: 'bg-slate-100 text-slate-600',
              failed: 'bg-red-200 text-red-800',
            };
            return (
              <span key={state} className={`rounded-full px-3 py-1 text-xs font-medium ${colors[state] || ''}`}>
                {state.replace(/_/g, ' ')}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
