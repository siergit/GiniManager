import type { AppRole } from '../types';

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: [
    'work_items:create',
    'work_items:update',
    'work_items:delete',
    'work_items:assign',
    'time_entries:approve',
    'users:manage',
    'teams:manage',
    'settings:manage',
    'reports:view_all',
  ],
  manager: [
    'work_items:create',
    'work_items:update',
    'work_items:assign',
    'time_entries:approve',
    'reports:view_team',
  ],
  collaborator: [
    'work_items:update_own',
    'time_entries:create_own',
    'reports:view_own',
  ],
};
