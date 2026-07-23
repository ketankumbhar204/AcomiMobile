import {
  aggregateBuildingStructure,
  buildSpaceSetupProgress,
} from '../spaceSetupProgress';
import type { BuildingSummaryResponse } from '../../api/types';

describe('buildSpaceSetupProgress', () => {
  it('marks empty accommodation space as needing property structure', () => {
    const progress = buildSpaceSetupProgress({
      spaceType: 'PG',
      buildingCount: 0,
      memberCount: 0,
      hasMealConfig: false,
    });

    expect(progress.needsPropertyStructure).toBe(true);
    expect(progress.nextStepId).toBe('createBuilding');
    expect(progress.isComplete).toBe(false);
    expect(progress.steps[0]).toEqual({ id: 'spaceCreated', done: true });
  });

  it('advances through structure steps using floors/rooms/beds', () => {
    const progress = buildSpaceSetupProgress({
      spaceType: 'PG',
      buildingCount: 1,
      floors: 2,
      rooms: 0,
      beds: 0,
      memberCount: 0,
      hasMealConfig: false,
    });

    expect(progress.needsPropertyStructure).toBe(false);
    expect(progress.nextStepId).toBe('addRooms');
  });

  it('skips structure steps for Mess spaces', () => {
    const progress = buildSpaceSetupProgress({
      spaceType: 'MESS',
      buildingCount: 0,
      memberCount: 0,
      hasMealConfig: false,
    });

    expect(progress.needsPropertyStructure).toBe(false);
    expect(progress.nextStepId).toBe('addMembers');
    expect(progress.steps.some(step => step.id === 'createBuilding')).toBe(false);
  });

  it('is complete when all applicable steps are done', () => {
    const progress = buildSpaceSetupProgress({
      spaceType: 'PG',
      buildingCount: 1,
      floors: 1,
      rooms: 2,
      beds: 4,
      memberCount: 3,
      hasMealConfig: true,
    });

    expect(progress.isComplete).toBe(true);
    expect(progress.nextStepId).toBeNull();
    expect(progress.percentRemaining).toBe(0);
  });
});

describe('aggregateBuildingStructure', () => {
  it('sums floors rooms and beds across buildings', () => {
    const summaries = [
      { floors: 1, rooms: 2, beds: 3 },
      { floors: 2, rooms: 1, beds: 4 },
    ] as BuildingSummaryResponse[];

    expect(aggregateBuildingStructure(summaries)).toEqual({
      floors: 3,
      rooms: 3,
      beds: 7,
    });
  });
});
