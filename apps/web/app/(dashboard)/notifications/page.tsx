import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const eventIcons: Record<string, string> = {
  state_change: '🔄',
  assignment: '👤',
  comment: '💬',
  time_reminder: '⏰',
  time_escalation: '🚨',
  deadline_approaching: '📅',
  overdue: '🔴',
  deviation_alert: '📊',
  dependency_resolved: '✅',
  dependency_blocked: '🚫',
  approval_requested: '📋',
  approval_granted: '✅',
  approval_rejected: '❌',
  capacity_overload: '⚠️',
};

export default async function NotificationsPage() {
  const supabase = createAdminClient();

  const { data: notifications } = await supabase
    .from('notification_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`px-4 py-3 flex items-start gap-3 ${!notif.is_read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <span className="text-lg mt-0.5">{eventIcons[notif.event_type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(notif.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {!notif.is_read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
          <span className="text-4xl">🔔</span>
          <p className="mt-4 text-gray-500">No notifications yet</p>
          <p className="mt-1 text-xs text-gray-400">Notifications will appear here when state changes, deadlines approach, or time reminders fire.</p>
        </div>
      )}
    </div>
  );
}
