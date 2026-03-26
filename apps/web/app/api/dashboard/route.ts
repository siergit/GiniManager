import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();

  // Get counts by state
  const { data: items } = await supabase
    .from('work_items')
    .select('state, priority, item_type');

  const total = items?.length || 0;
  const inProgress = items?.filter(i => i.state === 'in_progress').length || 0;
  const blocked = items?.filter(i => i.state === 'blocked').length || 0;
  const done = items?.filter(i => i.state === 'done').length || 0;
  const byState: Record<string, number> = {};
  const byType: Record<string, number> = {};

  items?.forEach(i => {
    byState[i.state] = (byState[i.state] || 0) + 1;
    byType[i.item_type] = (byType[i.item_type] || 0) + 1;
  });

  // Get team members
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active')
    .eq('is_active', true);

  return NextResponse.json({
    stats: { total, inProgress, blocked, done, byState, byType },
    users: users || [],
  });
}
