import type { WorkItemState } from '../types';

export const STATE_TRANSITIONS: Record<WorkItemState, WorkItemState[]> = {
  backlog: ['ready', 'planned', 'cancelled', 'deferred'],
  ready: ['planned', 'in_progress', 'cancelled', 'deferred', 'backlog'],
  planned: ['in_progress', 'blocked', 'cancelled', 'deferred', 'backlog'],
  in_progress: ['in_review', 'blocked', 'on_hold', 'done', 'cancelled', 'failed'],
  in_review: ['waiting_approval', 'in_progress', 'blocked', 'done', 'failed'],
  waiting_approval: ['approved', 'in_progress', 'in_review', 'blocked'],
  approved: ['done', 'in_progress'],
  blocked: ['in_progress', 'ready', 'planned', 'cancelled', 'on_hold'],
  on_hold: ['in_progress', 'ready', 'cancelled', 'backlog'],
  cancelled: ['backlog', 'reopened'],
  done: ['reopened'],
  archived: ['reopened'],
  reopened: ['in_progress', 'ready', 'planned', 'backlog'],
  deferred: ['backlog', 'ready', 'planned', 'cancelled'],
  failed: ['in_progress', 'backlog', 'cancelled'],
};

export const TERMINAL_STATES: WorkItemState[] = ['done', 'cancelled', 'archived'];

export const ACTIVE_STATES: WorkItemState[] = [
  'in_progress',
  'in_review',
  'waiting_approval',
  'approved',
];
