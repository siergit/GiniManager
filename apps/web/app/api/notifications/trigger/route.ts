import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// POST /api/notifications/trigger
// Body: { type: "morning" | "lunch" | "eod" }
// Triggers the notification for ALL active users
export async function POST(request: Request) {
  const supabase = createAdminClient();
  const body = await request.json();
  const type = body.type;

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt');

  const baseUrl = request.url.replace('/api/notifications/trigger', '');
  const endpoints: Record<string, string> = {
    morning: '/api/notifications/morning-briefing',
    lunch: '/api/notifications/lunch-summary',
    eod: '/api/notifications/eod-summary',
  };

  const endpoint = endpoints[type];
  if (!endpoint) {
    return NextResponse.json({ error: 'Invalid type. Use: morning, lunch, eod' }, { status: 400 });
  }

  const results = await Promise.all(
    (users || []).map(async (user) => {
      try {
        const res = await fetch(`${baseUrl}${endpoint}?user_id=${user.id}`, {
          headers: { Cookie: request.headers.get('Cookie') || '' },
        });
        const data = await res.json();
        return { user_id: user.id, status: 'ok', data };
      } catch (err) {
        return { user_id: user.id, status: 'error', error: String(err) };
      }
    })
  );

  return NextResponse.json({ type, triggered: results.length, results });
}
