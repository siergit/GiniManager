import type { WorkItemType } from '../types';

export const WORK_ITEM_TYPE_HIERARCHY: Record<WorkItemType, WorkItemType[]> = {
  area: ['project'],
  project: ['delivery'],
  delivery: ['task'],
  task: ['subtask'],
  subtask: [],
};
