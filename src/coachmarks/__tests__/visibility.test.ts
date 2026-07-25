import {
  canStartCoachmark,
  isCoachmarkLifecycleEligible,
} from '../../coachmarks/visibility';
import type { LifecycleState } from '../../spaceLifecycle/types';

describe('isCoachmarkLifecycleEligible', () => {
  const cases: Array<[LifecycleState, boolean]> = [
    ['NEW', true],
    ['SETUP_IN_PROGRESS', true],
    ['READY', false],
    ['ACTIVE', false],
    ['NEEDS_ATTENTION', false],
  ];

  it.each(cases)('%s → %s', (lifecycle, expected) => {
    expect(isCoachmarkLifecycleEligible(lifecycle)).toBe(expected);
  });

  it('rejects null / undefined', () => {
    expect(isCoachmarkLifecycleEligible(null)).toBe(false);
    expect(isCoachmarkLifecycleEligible(undefined)).toBe(false);
  });
});

describe('canStartCoachmark', () => {
  it('starts for NEW when not finished', () => {
    expect(
      canStartCoachmark({
        lifecycle: 'NEW',
        alreadyFinished: false,
      }),
    ).toBe(true);
  });

  it('blocks when already finished', () => {
    expect(
      canStartCoachmark({
        lifecycle: 'NEW',
        alreadyFinished: true,
      }),
    ).toBe(false);
  });

  it('blocks READY / ACTIVE / NEEDS_ATTENTION', () => {
    expect(
      canStartCoachmark({
        lifecycle: 'READY',
        alreadyFinished: false,
      }),
    ).toBe(false);
    expect(
      canStartCoachmark({
        lifecycle: 'ACTIVE',
        alreadyFinished: false,
      }),
    ).toBe(false);
    expect(
      canStartCoachmark({
        lifecycle: 'NEEDS_ATTENTION',
        alreadyFinished: false,
      }),
    ).toBe(false);
  });

  it('allows forceReplay even when finished or READY', () => {
    expect(
      canStartCoachmark({
        lifecycle: 'READY',
        alreadyFinished: true,
        forceReplay: true,
      }),
    ).toBe(true);
  });

  it('respects enabled=false', () => {
    expect(
      canStartCoachmark({
        lifecycle: 'NEW',
        alreadyFinished: false,
        enabled: false,
      }),
    ).toBe(false);
  });
});
