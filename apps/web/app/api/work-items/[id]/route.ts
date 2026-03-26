import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

// GET /api/work-items/:id
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
    .select(`
      *,
      assignee:users!work_items_assignee_id_fkey(id, full_name, email),
      children:work_items!work_items_parent_id_fkey(id, title, state, priority, item_type, progress_pct, assignee_id, estimated_minutes, actual_minutes),
      checklist:checklist_items(id, title, is_completed, sort_order),
      comments:comments(id, body, user_id, created_at, parent_id)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/work-items/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // Only allow updating specific fields
  const allowedFields = [
    'title', 'description', 'state', 'priority', 'assignee_id', 'team_id',
    'parent_id', 'estimated_minutes', 'start_date', 'due_date',
    'progress_override', 'blocked_reason', 'sort_order', 'tags',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from('work_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/work-items/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('work_items')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
