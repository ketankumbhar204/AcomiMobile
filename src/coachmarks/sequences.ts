import type { CoachmarkSequenceDefinition } from './types';

/** Accommodation landing (Accommodation tab) — ≤3 steps, one screen. */
export const ACCOMMODATION_SETUP_SEQUENCE: CoachmarkSequenceDefinition = {
  tourId: 'setup.accommodation.v1',
  steps: [
    {
      id: 'accommodation.next',
      anchorId: 'nextGuidance',
      bodyKey: 'coachmarks.accommodation.step1',
      primaryLabelKey: 'coachmarks.actions.next',
    },
    {
      id: 'accommodation.continue',
      anchorId: 'continueSetup',
      bodyKey: 'coachmarks.accommodation.step2',
      primaryLabelKey: 'coachmarks.actions.next',
    },
    {
      id: 'accommodation.layout',
      anchorId: 'propertyLayout',
      bodyKey: 'coachmarks.accommodation.step3',
      primaryLabelKey: 'coachmarks.actions.gotIt',
    },
  ],
};

/** Mess landing (Dashboard) — ≤3 steps, one screen. */
export const MESS_SETUP_SEQUENCE: CoachmarkSequenceDefinition = {
  tourId: 'setup.mess.v1',
  steps: [
    {
      id: 'mess.next',
      anchorId: 'nextRecommendedStep',
      bodyKey: 'coachmarks.mess.step1',
      primaryLabelKey: 'coachmarks.actions.next',
    },
    {
      id: 'mess.cta',
      anchorId: 'primaryCta',
      bodyKey: 'coachmarks.mess.step2',
      primaryLabelKey: 'coachmarks.actions.next',
    },
    {
      id: 'mess.progress',
      anchorId: 'businessProgress',
      bodyKey: 'coachmarks.mess.step3',
      primaryLabelKey: 'coachmarks.actions.gotIt',
    },
  ],
};

export function sequenceForTourId(
  tourId: CoachmarkSequenceDefinition['tourId'],
): CoachmarkSequenceDefinition {
  return tourId === 'setup.mess.v1'
    ? MESS_SETUP_SEQUENCE
    : ACCOMMODATION_SETUP_SEQUENCE;
}
