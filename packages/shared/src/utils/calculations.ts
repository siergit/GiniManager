import type { WorkItemState, RiskLevel } from '../types';

export function calculateProgress(item: {
  progress_override: number | null;
  estimated_minutes: number;
  actual_minutes: number;
  children?: { estimated_minutes: number; progress_pct: number }[];
}): number {
  if (item.progress_override !== null) return item.progress_override;

  if (item.children && item.children.length > 0) {
    const totalWeight = item.children.reduce(
      (sum, c) => sum + Math.max(c.estimated_minutes, 1),
      0,
    );
    const weightedProgress = item.children.reduce(
      (sum, c) => sum + c.progress_pct * Math.max(c.estimated_minutes, 1),
      0,
    );
    return Math.round((weightedProgress / totalWeight) * 100) / 100;
  }

  if (item.estimated_minutes <= 0) return 0;
  return Math.min(
    100,
    Math.round((item.actual_minutes / item.estimated_minutes) * 10000) / 100,
  );
}

export function calculateRemaining(
  estimated: number,
  actual: number,
): { remaining: number; is_over: boolean } {
  return {
    remaining: Math.max(0, estimated - actual),
    is_over: actual > estimated,
  };
}

export function calculateDeviation(estimated: number, actual: number): number {
  if (estimated <= 0) return 0;
  return Math.round(((actual - estimated) / estimated) * 10000) / 100;
}

export function calculateRisk(params: {
  deviation_pct: number;
  due_date: string | null;
  state: WorkItemState;
  has_blocked_dependencies: boolean;
}): RiskLevel {
  let score = 0;

  if (params.deviation_pct > 50) score += 3;
  else if (params.deviation_pct > 25) score += 2;
  else if (params.deviation_pct > 10) score += 1;

  if (params.due_date) {
    const daysUntilDue = Math.floor(
      (new Date(params.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilDue < 0) score += 3;
    else if (daysUntilDue <= 1) score += 2;
    else if (daysUntilDue <= 3) score += 1;
  }

  if (params.has_blocked_dependencies) score += 2;
  if (params.state === 'blocked') score += 1;

  if (score >= 6) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export function forecastCompletion(params: {
  remaining_minutes: number;
  daily_capacity_minutes: number;
}): { estimated_days: number; estimated_date: string } | null {
  if (params.daily_capacity_minutes <= 0) return null;

  const days = Math.ceil(params.remaining_minutes / params.daily_capacity_minutes);
  const date = new Date();
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }

  return {
    estimated_days: days,
    estimated_date: date.toISOString().split('T')[0],
  };
}
