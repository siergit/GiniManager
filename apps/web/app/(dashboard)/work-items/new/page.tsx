import { createAdminClient } from '@/lib/supabase-admin';
import CreateWorkItemForm from './create-form';

export const dynamic = 'force-dynamic';

export default async function NewWorkItemPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();

  const { data: parentItems } = await supabase
    .from('work_items')
    .select('id, title, item_type, depth')
    .in('item_type', ['area', 'project', 'delivery', 'task'])
    .order('depth')
    .order('title');

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('is_active', true)
    .neq('email', 'admin@sier.pt')
    .order('full_name');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Work Item</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new area, project, delivery, task, or subtask</p>
      </div>
      <CreateWorkItemForm parentItems={parentItems || []} users={users || []} defaultParentId={params.parent} />
    </div>
  );
}
