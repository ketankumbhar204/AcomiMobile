import type { CoachmarkTourId } from '../utils/coachmarkStorage';

/** Stable anchor ids registered via CoachmarkAnchor. */
export type CoachmarkAnchorId =
  | 'nextRecommendedStep'
  | 'primaryCta'
  | 'businessProgress'
  | 'continueSetup'
  | 'propertyLayout'
  | 'nextGuidance';

export type CoachmarkAnchorLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CoachmarkStepDefinition = {
  id: string;
  anchorId: CoachmarkAnchorId;
  /** i18n key for body copy */
  bodyKey: string;
  /** i18n key for primary button (Next / Got it) */
  primaryLabelKey: string;
};

export type CoachmarkSequenceDefinition = {
  tourId: CoachmarkTourId;
  steps: readonly CoachmarkStepDefinition[];
};

export type ActiveCoachmarkState = {
  tourId: CoachmarkTourId;
  spaceId: string;
  stepIndex: number;
  steps: readonly CoachmarkStepDefinition[];
};
