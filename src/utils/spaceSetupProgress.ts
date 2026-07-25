import type { BuildingSummaryResponse, SpaceType } from '../api/types';
import { isAccommodationApplicable } from './accommodationProfile';

export type SetupStepId =
  | 'spaceCreated'
  | 'createBuilding'
  | 'addFloors'
  | 'addRooms'
  | 'addBeds'
  | 'addMembers'
  | 'configureMeals';

export type SetupStep = {
  id: SetupStepId;
  done: boolean;
};

export type SpaceSetupProgress = {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  /** 0–100 remaining work. */
  percentRemaining: number;
  nextStepId: SetupStepId | null;
  isComplete: boolean;
  /** True when property has no buildings yet (accommodation spaces only). */
  needsPropertyStructure: boolean;
};

type BuildSetupProgressInput = {
  spaceType: SpaceType | null | undefined;
  buildingCount: number;
  /** Aggregated across buildings; omit when unknown / still loading. */
  floors?: number;
  rooms?: number;
  beds?: number;
  memberCount: number;
  /** True when at least one meal menu/library item exists. */
  hasMealConfig: boolean;
};

export function aggregateBuildingStructure(summaries: BuildingSummaryResponse[]): {
  floors: number;
  units: number;
  rooms: number;
  beds: number;
} {
  return summaries.reduce(
    (acc, summary) => ({
      floors: acc.floors + (summary.floors ?? 0),
      units: acc.units + (summary.units ?? 0),
      rooms: acc.rooms + (summary.rooms ?? 0),
      beds: acc.beds + (summary.beds ?? 0),
    }),
    { floors: 0, units: 0, rooms: 0, beds: 0 },
  );
}

/**
 * Progressive setup checklist for first-time owners.
 * Mess spaces skip property-structure steps.
 */
export function buildSpaceSetupProgress(
  input: BuildSetupProgressInput,
): SpaceSetupProgress {
  const accommodation = input.spaceType
    ? isAccommodationApplicable(input.spaceType)
    : true;

  const floors = input.floors ?? 0;
  const rooms = input.rooms ?? 0;
  const beds = input.beds ?? 0;
  const hasBuilding = input.buildingCount > 0;

  const steps: SetupStep[] = [
    { id: 'spaceCreated', done: true },
  ];

  if (accommodation) {
    steps.push(
      { id: 'createBuilding', done: hasBuilding },
      { id: 'addFloors', done: hasBuilding && floors > 0 },
      { id: 'addRooms', done: hasBuilding && rooms > 0 },
      { id: 'addBeds', done: hasBuilding && beds > 0 },
    );
  }

  steps.push(
    { id: 'addMembers', done: input.memberCount > 0 },
    { id: 'configureMeals', done: input.hasMealConfig },
  );

  const completedCount = steps.filter(step => step.done).length;
  const totalCount = steps.length;
  const nextStep = steps.find(step => !step.done) ?? null;
  const isComplete = nextStep == null;
  const percentRemaining =
    totalCount === 0
      ? 0
      : Math.round(((totalCount - completedCount) / totalCount) * 100);

  return {
    steps,
    completedCount,
    totalCount,
    percentRemaining,
    nextStepId: nextStep?.id ?? null,
    isComplete,
    needsPropertyStructure: accommodation && !hasBuilding,
  };
}
