export type AppRole = 'admin' | 'manager' | 'collaborator';

export type WorkItemType = 'area' | 'project' | 'delivery' | 'task' | 'subtask';

export type WorkItemState =
  | 'backlog'
  | 'ready'
  | 'planned'
  | 'in_progress'
  | 'in_review'
  | 'waiting_approval'
  | 'approved'
  | 'blocked'
  | 'on_hold'
  | 'cancelled'
  | 'done'
  | 'archived'
  | 'reopened'
  | 'deferred'
  | 'failed';

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'none';

export type DependencyType =
  | 'finish_to_start'
  | 'start_to_start'
  | 'finish_to_finish'
  | 'approval'
  | 'colleague'
  | 'external_entity'
  | 'date_milestone';

export type DependencyStatus = 'pending' | 'satisfied' | 'waived';

export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type CapacityType = 'full_time' | 'part_time';

export type ExceptionType =
  | 'vacation'
  | 'sick_leave'
  | 'public_holiday'
  | 'training'
  | 'other_absence'
  | 'extra_availability';

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export type NotificationEventType =
  | 'time_reminder'
  | 'time_escalation'
  | 'state_change'
  | 'assignment'
  | 'comment'
  | 'dependency_resolved'
  | 'dependency_blocked'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_rejected'
  | 'deadline_approaching'
  | 'overdue'
  | 'deviation_alert'
  | 'capacity_overload';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: AppRole;
  is_active: boolean;
  timezone: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  id: string;
  parent_id: string | null;
  item_type: WorkItemType;
  sort_order: number;
  title: string;
  description: string | null;
  state: WorkItemState;
  priority: Priority;
  assignee_id: string | null;
  reporter_id: string | null;
  team_id: string | null;
  start_date: string | null;
  due_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  estimated_minutes: number;
  actual_minutes: number;
  remaining_minutes: number;
  progress_pct: number;
  progress_override: number | null;
  risk_level: RiskLevel;
  deviation_pct: number;
  blocked_reason: string | null;
  state_changed_at: string;
  is_milestone: boolean;
  tags: string[];
  depth: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  work_item_id: string;
  date: string;
  minutes: number;
  description: string | null;
  timer_started_at: string | null;
  timer_stopped_at: string | null;
  is_timer: boolean;
  status: TimeEntryStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  work_item_id: string;
  parent_id: string | null;
  user_id: string;
  body: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkItemDependency {
  id: string;
  work_item_id: string;
  depends_on_work_item_id: string | null;
  depends_on_user_id: string | null;
  depends_on_external_entity_id: string | null;
  depends_on_date: string | null;
  dependency_type: DependencyType;
  status: DependencyStatus;
  lag_days: number;
  notes: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  work_item_id: string;
  title: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
}

export interface NotificationEvent {
  id: string;
  user_id: string;
  event_type: NotificationEventType;
  channel: NotificationChannel;
  title: string;
  body: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}
