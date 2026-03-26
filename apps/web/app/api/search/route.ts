import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

// GET /api/search?q=query
export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createAdminClient();
  const searchTerm = `%${q}%`;

  // Search work items
  const { data: items } = await supabase
    .from('work_items')
    .select('id, title, item_type, state, priority')
    .ilike('title', searchTerm)
    .limit(10);

  // Search comments
  const { data: comments } = await supabase
    .from('comments')
    .select('id, body, work_item_id, user:users!comments_user_id_fkey(full_name)')
    .ilike('body', searchTerm)
    .limit(5);

  // Search users
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .limit(5);

  return NextResponse.json({
    results: {
      items: items || [],
      comments: comments || [],
      users: users || [],
    },
    total: (items?.length || 0) + (comments?.length || 0) + (users?.length || 0),
  });
}
