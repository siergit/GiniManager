import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

// GET /api/work-items/:id/children
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('work_items')
    .select('*, assignee:users!work_items_assignee_id_fkey(id, full_name)')
    .eq('parent_id', id)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
