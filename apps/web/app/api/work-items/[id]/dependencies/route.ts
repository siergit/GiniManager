import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;
  const supabase = createAdminClient();

  // Get dependencies where this item depends on something
  const { data: dependsOn } = await supabase
    .from('work_item_dependencies')
    .select('*, target:work_items!work_item_dependencies_depends_on_work_item_id_fkey(id, title, state, item_type)')
    .eq('work_item_id', id);

  // Get dependencies where something depends on this item
  const { data: dependedBy } = await supabase
    .from('work_item_dependencies')
    .select('*, source:work_items!work_item_dependencies_work_item_id_fkey(id, title, state, item_type)')
    .eq('depends_on_work_item_id', id);

  return NextResponse.json({ dependsOn: dependsOn || [], dependedBy: dependedBy || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data: adminUser } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).single();

  const { data, error } = await supabase
    .from('work_item_dependencies')
    .insert({
      work_item_id: id,
      depends_on_work_item_id: body.depends_on_work_item_id || null,
      depends_on_date: body.depends_on_date || null,
      dependency_type: body.dependency_type || 'finish_to_start',
      notes: body.notes || null,
      created_by: adminUser?.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const depId = searchParams.get('dep_id');

  if (!depId) return NextResponse.json({ error: 'dep_id required' }, { status: 400 });

  const { error } = await supabase.from('work_item_dependencies').delete().eq('id', depId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
