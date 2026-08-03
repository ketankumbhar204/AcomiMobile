import type { MenuHistoryItemResponse, MealType } from '../api/types';

export type MenuHistoryGroupKey = 'today' | 'yesterday' | 'last7Days' | 'older';

export type MenuHistoryGroup = {
  key: MenuHistoryGroupKey;
  items: MenuHistoryItemResponse[];
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Parse YYYY-MM-DD as a local calendar day (avoid UTC shift). */
function parseLocalDateOnly(raw: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseHistoryDate(item: MenuHistoryItemResponse): Date | null {
  if (item.lastUsedMenuDate) {
    const local = parseLocalDateOnly(String(item.lastUsedMenuDate));
    if (local) return local;
  }
  const raw = item.lastUsedAt;
  if (!raw) return null;
  const asLocal = parseLocalDateOnly(String(raw));
  if (asLocal) return asLocal;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Keep only history rows for the active planner meal type. */
export function filterHistoryForMealType(
  items: MenuHistoryItemResponse[],
  mealType: MealType,
): MenuHistoryItemResponse[] {
  return (items ?? []).filter(item => !item.mealType || item.mealType === mealType);
}

export function groupMenuHistoryItems(
  items: MenuHistoryItemResponse[],
  now: Date = new Date(),
): MenuHistoryGroup[] {
  const today = startOfLocalDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const last7 = new Date(today);
  last7.setDate(today.getDate() - 6);

  const buckets: Record<MenuHistoryGroupKey, MenuHistoryItemResponse[]> = {
    today: [],
    yesterday: [],
    last7Days: [],
    older: [],
  };

  for (const item of items) {
    const used = parseHistoryDate(item);
    if (!used) {
      buckets.older.push(item);
      continue;
    }
    const day = startOfLocalDay(used);
    if (day.getTime() === today.getTime()) {
      buckets.today.push(item);
    } else if (day.getTime() === yesterday.getTime()) {
      buckets.yesterday.push(item);
    } else if (day.getTime() >= last7.getTime()) {
      buckets.last7Days.push(item);
    } else {
      buckets.older.push(item);
    }
  }

  const order: MenuHistoryGroupKey[] = ['today', 'yesterday', 'last7Days', 'older'];
  return order
    .filter(key => buckets[key].length > 0)
    .map(key => ({ key, items: buckets[key] }));
}

export function formatHistoryLastUsedLabel(
  item: MenuHistoryItemResponse,
  formatDate: (iso: string) => string,
  labels: { today: string; yesterday: string },
  now: Date = new Date(),
): string {
  const used = parseHistoryDate(item);
  if (!used) {
    return formatDate(item.lastUsedAt);
  }
  const today = startOfLocalDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = startOfLocalDay(used);
  if (day.getTime() === today.getTime()) {
    return labels.today;
  }
  if (day.getTime() === yesterday.getTime()) {
    return labels.yesterday;
  }
  return formatDate(item.lastUsedMenuDate || item.lastUsedAt);
}
