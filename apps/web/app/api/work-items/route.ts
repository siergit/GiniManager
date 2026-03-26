import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

// GET /api/work-items - List work items with filters
export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const parent_id = searchParams.get('parent_id');
  const item_type = searchParams.get('item_type');
  const state = searchParams.get('state');
  const priority = searchParams.get('priority');
  const assignee_id = searchParams.get('assignee_id');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('work_items')
    .select('*, assignee:users!work_items_assignee_id_fkey(id, full_name, email)', { count: 'exact' });

  if (parent_id === 'null') {
    query = query.is('parent_id', null);
  } else if (parent_id) {
    query = query.eq('parent_id', parent_id);
  }

  if (item_type) query = query.eq('item_type', item_type);
  if (state) query = query.in('state', state.split(','));
  if (priority) query = query.in('priority', priority.split(','));
  if (assignee_id) query = query.eq('assignee_id', assignee_id);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, count, error } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, limit, offset });
}

// POST /api/work-items - Create work item
export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  // For admin login, we need a user ID. Get the first admin user or create a system user.
  let { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  // If no admin user exists yet, we'll use a placeholder
  const createdBy = adminUser?.id;
  if (!createdBy) {
    return NextResponse.json(
      { error: 'No admin user found. Please seed the database first.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('work_items')
    .insert({
      title: body.title,
      description: body.description || null,
      item_type: body.item_type || 'task',
      parent_id: body.parent_id || null,
      state: body.state || 'backlog',
      priority: body.priority || 'medium',
      assignee_id: body.assignee_id || null,
      team_id: body.team_id || null,
      estimated_minutes: body.estimated_minutes || 0,
      start_date: body.start_date || null,
      due_date: body.due_date || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
