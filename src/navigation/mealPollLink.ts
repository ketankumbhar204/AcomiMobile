import { navigateMainStack } from './mainStackNavigation';
import { navigationRef } from './navigationRef';

const MEAL_POLL_PATH =
  /^\/spaces\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/meals\/poll\/?$/i;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;

export type MealPollMealType = (typeof MEAL_TYPES)[number];

export type MealPollDestination = {
  spaceId: string;
  menuDate: string;
  mealType?: MealPollMealType;
};

export type MealPollIngestResult = 'ignored' | 'queued' | 'opened' | 'duplicate';

/** Collapses the cold-start pair of getInitialURL plus the first url event. */
const DUPLICATE_WINDOW_MS = 1500;

let pending: MealPollDestination | null = null;
let navigationReady = false;
let lastOpenedKey: string | null = null;
let lastOpenedAt = 0;

export function parseMealPollLink(url: string | null | undefined): MealPollDestination | null {
  if (!url) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'app.acomi.in') {
    return null;
  }
  const match = parsed.pathname.match(MEAL_POLL_PATH);
  if (!match?.[1]) {
    return null;
  }
  const menuDate = parsed.searchParams.get('date');
  if (!menuDate || !isRealIsoDate(menuDate)) {
    return null;
  }
  const meal = parsed.searchParams.get('meal');
  let mealType: MealPollMealType | undefined;
  if (meal != null && meal.trim() !== '') {
    const normalized = meal.trim().toUpperCase();
    if (!isMealType(normalized)) {
      return null;
    }
    mealType = normalized;
  }
  return {
    spaceId: match[1].toLowerCase(),
    menuDate,
    ...(mealType ? { mealType } : {}),
  };
}

/**
 * Remember a meal-poll URL. Other URLs, including enquiry and Play Store links,
 * are ignored and do not clear a destination that is already waiting.
 */
export function ingestMealPollUrl(url: string | null | undefined): MealPollIngestResult {
  const destination = parseMealPollLink(url);
  if (!destination) {
    return 'ignored';
  }
  const key = destinationKey(destination);
  if (isRecentOpen(key)) {
    return 'duplicate';
  }
  pending = destination;
  if (!navigationReady) {
    return 'queued';
  }
  return flushPendingMealPoll() ? 'opened' : 'queued';
}

export function setMealPollNavigationReady(ready: boolean): void {
  navigationReady = ready;
  if (ready) {
    flushPendingMealPoll();
  }
}

/** Open the saved poll once. Returns false when navigation is not ready or nothing is saved. */
export function flushPendingMealPoll(): boolean {
  if (!navigationReady || !pending || !navigationRef.isReady()) {
    return false;
  }
  const destination = pending;
  pending = null;
  lastOpenedKey = destinationKey(destination);
  lastOpenedAt = Date.now();
  navigateMainStack(
    'MealPollResponse',
    destination.mealType
      ? {
          spaceId: destination.spaceId,
          menuDate: destination.menuDate,
          mealType: destination.mealType,
        }
      : {
          spaceId: destination.spaceId,
          menuDate: destination.menuDate,
        },
  );
  return true;
}

export function peekPendingMealPoll(): MealPollDestination | null {
  return pending;
}

export function resetMealPollLinkState(): void {
  pending = null;
  navigationReady = false;
  lastOpenedKey = null;
  lastOpenedAt = 0;
}

function destinationKey(destination: MealPollDestination): string {
  return `${destination.spaceId}|${destination.menuDate}|${destination.mealType ?? ''}`;
}

function isRecentOpen(key: string): boolean {
  return lastOpenedKey === key && Date.now() - lastOpenedAt < DUPLICATE_WINDOW_MS;
}

function isMealType(value: string): value is MealPollMealType {
  return (MEAL_TYPES as readonly string[]).includes(value);
}

function isRealIsoDate(value: string): boolean {
  const match = value.match(ISO_DATE);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
