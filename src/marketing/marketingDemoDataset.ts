import type { SpaceType } from '../api/types';

/**
 * Stable illustrative summary figures for Marketing Demo Mode.
 * Generated once per space until `regenerateMarketingDemoDataset` is called.
 * These numbers are never written to the API or the database.
 */

export type MarketingDemoMetrics = {
  spaceType: SpaceType;
  members: number;
  activeMembers: number;
  occupied: number;
  available: number;
  reserved: number;
  totalCapacity: number;
  occupancyPercent: number;
  expected: number;
  collected: number;
  pending: number;
  underReview: number;
  pendingCount: number;
  moveInsThisMonth: number;
  breakfastResponses: number;
  lunchResponses: number;
  dinnerResponses: number;
  mealResponses: number;
  activeSubscriptions: number;
};

type IntRange = { min: number; max: number };

type SpaceRanges = {
  people: IntRange;
  capacity: IntRange;
  expected: IntRange;
};

const SPACE_RANGES: Record<SpaceType, SpaceRanges> = {
  PG: { people: { min: 150, max: 190 }, capacity: { min: 170, max: 220 }, expected: { min: 450000, max: 620000 } },
  HOSTEL: { people: { min: 165, max: 210 }, capacity: { min: 190, max: 240 }, expected: { min: 480000, max: 680000 } },
  CO_LIVING: { people: { min: 90, max: 160 }, capacity: { min: 100, max: 180 }, expected: { min: 350000, max: 520000 } },
  RENTAL: { people: { min: 28, max: 55 }, capacity: { min: 32, max: 64 }, expected: { min: 480000, max: 750000 } },
  CORPORATE_STAY: { people: { min: 24, max: 48 }, capacity: { min: 28, max: 56 }, expected: { min: 400000, max: 700000 } },
  MESS: { people: { min: 145, max: 200 }, capacity: { min: 145, max: 200 }, expected: { min: 180000, max: 320000 } },
};

let sessionSalt = 0xa11ce;
const cache = new Map<string, MarketingDemoMetrics>();

/** Drop the cached set so the next read builds a new stable dataset. */
export function regenerateMarketingDemoDataset(): void {
  sessionSalt = (sessionSalt + 0x9e3779b9) >>> 0;
  cache.clear();
}

export function getMarketingDemoMetrics(
  spaceId: string,
  spaceType: SpaceType | null | undefined,
): MarketingDemoMetrics | null {
  if (!spaceId || spaceType == null || SPACE_RANGES[spaceType] == null) {
    return null;
  }
  const key = `${sessionSalt}:${spaceId}:${spaceType}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  const created = buildMetrics(spaceId, spaceType, sessionSalt);
  cache.set(key, created);
  return created;
}

function buildMetrics(spaceId: string, spaceType: SpaceType, salt: number): MarketingDemoMetrics {
  const rng = mulberry32(hashString(`${salt}:${spaceType}:${spaceId}`));
  const ranges = SPACE_RANGES[spaceType];
  const expected = roundTo(pickInt(rng, ranges.expected.min, ranges.expected.max), 5000);
  const collected = roundTo(expected * (0.72 + rng() * 0.1), 5000);
  let underReview = roundTo(expected * (0.03 + rng() * 0.04), 5000);
  let pending = expected - collected - underReview;
  if (pending < 5000) {
    underReview = Math.max(0, underReview + pending - 5000);
    pending = expected - collected - underReview;
  }
  pending = Math.max(0, pending);

  const totalCapacity = pickInt(rng, ranges.capacity.min, ranges.capacity.max);
  const reserved = Math.max(1, Math.min(Math.round(totalCapacity * 0.04), pickInt(rng, 2, 8)));
  const occupiedMax = totalCapacity - reserved - 1;
  const occupiedMin = Math.min(occupiedMax, Math.round(totalCapacity * 0.74));
  const occupied = pickInt(rng, occupiedMin, occupiedMax);
  const available = totalCapacity - occupied - reserved;
  const occupancyPercent = Math.round((occupied / totalCapacity) * 100);

  const members =
    spaceType === 'MESS'
      ? pickInt(rng, ranges.people.min, ranges.people.max)
      : Math.min(ranges.people.max, Math.max(ranges.people.min, occupied + pickInt(rng, 0, 12)));
  const activeMembers = Math.max(1, members - pickInt(rng, 0, 4));

  const breakfastResponses = mealCount(rng, members, 0.55, 0.75);
  const lunchResponses = mealCount(rng, members, 0.7, 0.9);
  const dinnerResponses = mealCount(rng, members, 0.6, 0.84);
  const mealResponses = Math.max(breakfastResponses, lunchResponses, dinnerResponses);
  const activeSubscriptions = Math.min(members, Math.round(members * (0.78 + rng() * 0.12)));
  const pendingCount = Math.min(48, Math.max(8, Math.round(pending / Math.max(4000, expected / Math.max(members, 1)))));
  const moveInsThisMonth = Math.min(occupied, pickInt(rng, 8, 24));

  return {
    spaceType,
    members,
    activeMembers,
    occupied,
    available,
    reserved,
    totalCapacity,
    occupancyPercent,
    expected,
    collected,
    pending,
    underReview,
    pendingCount,
    moveInsThisMonth,
    breakfastResponses,
    lunchResponses,
    dinnerResponses,
    mealResponses,
    activeSubscriptions,
  };
}

function mealCount(rng: () => number, customers: number, minRatio: number, maxRatio: number): number {
  if (customers <= 0) {
    return 0;
  }
  const count = Math.round(customers * (minRatio + rng() * (maxRatio - minRatio)));
  return Math.max(0, Math.min(customers, count));
}

function pickInt(rng: () => number, min: number, max: number): number {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  if (high <= low) {
    return low;
  }
  return low + Math.floor(rng() * (high - low + 1));
}

function roundTo(value: number, step: number): number {
  return Math.max(0, Math.round(value / step) * step);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
