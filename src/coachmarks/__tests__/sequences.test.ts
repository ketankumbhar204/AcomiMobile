import { sequenceForTourId } from '../sequences';

describe('coachmark sequences', () => {
  it('accommodation tour has ≤3 steps with Got it on last', () => {
    const seq = sequenceForTourId('setup.accommodation.v1');
    expect(seq.steps).toHaveLength(3);
    expect(seq.steps[2]?.primaryLabelKey).toBe('coachmarks.actions.gotIt');
    expect(seq.steps.map(s => s.anchorId)).toEqual([
      'nextGuidance',
      'continueSetup',
      'propertyLayout',
    ]);
  });

  it('mess tour has ≤3 steps targeting setup card regions', () => {
    const seq = sequenceForTourId('setup.mess.v1');
    expect(seq.steps).toHaveLength(3);
    expect(seq.steps.map(s => s.anchorId)).toEqual([
      'nextRecommendedStep',
      'primaryCta',
      'businessProgress',
    ]);
  });
});
