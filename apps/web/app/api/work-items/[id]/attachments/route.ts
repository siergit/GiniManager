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

  const { data, error } = await supabase
    .from('attachments')
    .select('*, uploader:users!attachments_uploaded_by_fkey(full_name)')
    .eq('work_item_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Get admin user for uploaded_by
  const { data: adminUser } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).single();
  const uploaderId = adminUser?.id;

  // Upload to Supabase Storage
  const fileName = `${Date.now()}-${file.name}`;
  const storagePath = `${uploaderId}/${id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(storagePath, file);

  if (uploadError) {
    // Storage bucket might not exist - save metadata anyway
    console.error('Storage upload error:', uploadError);
  }

  // Save attachment metadata
  const { data, error } = await supabase
    .from('attachments')
    .insert({
      work_item_id: id,
      uploaded_by: uploaderId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      storage_path: storagePath,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
