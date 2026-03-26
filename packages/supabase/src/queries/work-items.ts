import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkItemType, WorkItemState, Priority } from '@gini/shared';

export interface WorkItemFilters {
  parent_id?: string | null;
  item_type?: WorkItemType;
  state?: WorkItemState[];
  priority?: Priority[];
  assignee_id?: string;
  team_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listWorkItems(
  supabase: SupabaseClient,
  filters: WorkItemFilters = {},
) {
  let query = supabase
    .from('work_items')
    .select('*, assignee:users!assignee_id(id, full_name, avatar_url)', {
      count: 'exact',
    });

  if (filters.parent_id !== undefined) {
    query = filters.parent_id === null
      ? query.is('parent_id', null)
      : query.eq('parent_id', filters.parent_id);
  }
  if (filters.item_type) query = query.eq('item_type', filters.item_type);
  if (filters.state?.length) query = query.in('state', filters.state);
  if (filters.priority?.length) query = query.in('priority', filters.priority);
  if (filters.assignee_id) query = query.eq('assignee_id', filters.assignee_id);
  if (filters.team_id) query = query.eq('team_id', filters.team_id);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  query = query
    .order('sort_order', { ascending: true })
    .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 50) - 1);

  return query;
}

export async function getWorkItemTree(
  supabase: SupabaseClient,
  rootId: string,
  maxDepth = 5,
) {
  const { data, error } = await supabase.rpc('get_work_item_tree', {
    p_root_id: rootId,
    p_max_depth: maxDepth,
  });
  return { data, error };
}

export async function updateWorkItemState(
  supabase: SupabaseClient,
  id: string,
  newState: WorkItemState,
  reason?: string,
) {
  return supabase
    .from('work_items')
    .update({
      state: newState,
      blocked_reason: newState === 'blocked' ? reason : null,
    })
    .eq('id', id)
    .select()
    .single();
}
