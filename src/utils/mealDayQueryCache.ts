import { mealsApi } from '../api/mealsApi';
import type {
  DailyMenuResponse,
  MealEligibilitySummaryResponse,
  MealHeadcountDayResponse,
  MealPollDayResponse,
  MealType,
  UUID,
} from '../api/types';

/**
 * In-flight dedupe for hot meal GETs. Concurrent identical calls (multiple hooks /
 * focus+effect) share one HTTP request so dashboard load cannot multiply traffic.
 */
const inflight = new Map<string, Promise<unknown>>();

function dedupeGet<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const request = factory().finally(() => {
    if (inflight.get(key) === request) {
      inflight.delete(key);
    }
  });
  inflight.set(key, request);
  return request;
}

export function fetchDailyMenusByDateCached(
  spaceId: UUID,
  menuDate: string,
): Promise<DailyMenuResponse[]> {
  return dedupeGet(`menus:${spaceId}:${menuDate}`, () =>
    mealsApi.getDailyMenusByDate(spaceId, menuDate),
  );
}

export function fetchMealPollsCached(
  spaceId: UUID,
  menuDate: string,
): Promise<MealPollDayResponse> {
  return dedupeGet(`polls:${spaceId}:${menuDate}`, () =>
    mealsApi.getMealPolls(spaceId, menuDate),
  );
}

export function fetchEligibilitySummaryCached(
  spaceId: UUID,
  menuDate: string,
): Promise<MealEligibilitySummaryResponse> {
  return dedupeGet(`eligibility:${spaceId}:${menuDate}`, () =>
    mealsApi.getEligibilitySummary(spaceId, menuDate),
  );
}

export function fetchMealHeadcountDayCached(
  spaceId: UUID,
  menuDate: string,
): Promise<MealHeadcountDayResponse> {
  return dedupeGet(`headcount:${spaceId}:${menuDate}`, () =>
    mealsApi.getMealHeadcountDay(spaceId, menuDate),
  );
}

/** One round-trip bundle for dashboard meal operations (3 parallel, deduped). */
export async function fetchDashboardMealDayBundle(
  spaceId: UUID,
  menuDate: string,
): Promise<{
  menus: DailyMenuResponse[];
  polls: MealPollDayResponse;
  eligibility: MealEligibilitySummaryResponse | null;
}> {
  const [menus, polls, eligibility] = await Promise.all([
    fetchDailyMenusByDateCached(spaceId, menuDate).catch(error => {
      console.warn('[mealDayQueryCache] daily menus failed', error);
      return [] as DailyMenuResponse[];
    }),
    fetchMealPollsCached(spaceId, menuDate).catch(error => {
      console.warn('[mealDayQueryCache] meal polls failed', error);
      return {
        pollDate: menuDate,
        polls: [],
      };
    }),
    fetchEligibilitySummaryCached(spaceId, menuDate).catch(error => {
      console.warn('[mealDayQueryCache] eligibility failed', error);
      return null;
    }),
  ]);
  return { menus, polls, eligibility };
}

export function resetMealDayQueryCacheForTests(): void {
  inflight.clear();
}
