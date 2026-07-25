import type { SpacePermissionsResponse, SpaceType, UUID } from '../api/types';

/** Space lifecycle states — design doc § Space Lifecycle. */
export type LifecycleState =
  | 'NEW'
  | 'SETUP_IN_PROGRESS'
  | 'READY'
  | 'ACTIVE'
  | 'NEEDS_ATTENTION';

/** Canonical milestone identifiers (no UI copy). */
export type MilestoneId =
  | 'SPACE_CREATED'
  | 'PROPERTY_READY'
  | 'RESIDENTS_READY'
  | 'MEALS_READY'
  | 'TODAYS_MENU_READY'
  | 'MENU_SHARED'
  | 'DELIVERY_READY'
  | 'OPS_READY';

export type MilestoneKind = 'required' | 'recommended' | 'optional' | 'derived';

/**
 * Navigation target identifiers — map to existing screens in later phases.
 * Not React Navigation route objects (keeps domain layer UI-agnostic).
 */
export type SetupNavigationTarget =
  | 'QUICK_SETUP'
  | 'ACCOMMODATION_HOME'
  | 'BUILDING_FORM'
  | 'MEMBERS'
  | 'ADD_MEMBER'
  | 'MENU_LIBRARY'
  | 'MENU_PLANNING'
  | 'MENU_SHARE'
  | 'DELIVERY_LOCATIONS'
  | 'DASHBOARD'
  | 'PENDING_ACTIONS';

/** Catalog entry for a milestone (IDs + metadata only). */
export type MilestoneDefinition = {
  id: MilestoneId;
  /** Stable i18n key stem for later UI phases — not resolved here. */
  i18nKeyStem: string;
};

/** How a milestone appears on a space-type profile. */
export type ProfileMilestone = {
  id: MilestoneId;
  kind: Exclude<MilestoneKind, 'derived'>;
  navigationTarget: SetupNavigationTarget;
  /**
   * Permission gate on the recommendation CTA.
   * If the user lacks this capability, the milestone is skipped for recommendations
   * (completion is still tracked when predicates say done).
   */
  requiredPermission?: keyof SpacePermissionsResponse;
};

/** Ordered setup profile for one space type. */
export type SetupProfile = {
  spaceType: SpaceType;
  milestones: ProfileMilestone[];
};

/**
 * Pure input snapshot for predicates. Callers supply already-fetched signals —
 * predicates must not perform network I/O.
 */
export type PredicateContext = {
  spaceType: SpaceType;
  /** True once the space exists in session (always true when evaluating an open space). */
  spaceExists: boolean;
  buildingCount: number;
  floorCount: number;
  unitCount: number;
  roomCount: number;
  bedCount: number;
  memberCount: number;
  /** Active menu library items or combos present. */
  hasMealLibrary: boolean;
  /** At least one meal slot planned for today (draft or published). */
  hasTodaysMenuPlanned: boolean;
  /** At least one meal slot shared/published for today. */
  hasMenuShared: boolean;
  deliveryLocationCount: number;
  /** Pending Actions / Global Attention count for this space. */
  pendingActionCount: number;
  /**
   * Soft ACTIVE graduation (Phase 0 default): true after first visit once READY,
   * or when an operational signal is known. Callers may pass false until Phase 2.
   */
  hasOperationalSignal: boolean;
  permissions: SpacePermissionsResponse;
  /** Optional tips the user dismissed (milestone ids). */
  dismissedOptionalMilestoneIds?: readonly MilestoneId[];
};

export type MilestoneStatus = {
  id: MilestoneId;
  kind: MilestoneKind;
  done: boolean;
  applies: boolean;
  navigationTarget: SetupNavigationTarget | null;
};

export type RecommendedAction = {
  milestoneId: MilestoneId;
  kind: Exclude<MilestoneKind, 'derived'>;
  priority: number;
  navigationTarget: SetupNavigationTarget;
  /** i18n key stems — UI resolves in later phases. */
  titleKey: string;
  reasonKey: string;
  ctaLabelKey: string;
};

export type SetupProgressSnapshot = {
  /** Required milestones only. */
  requiredTotal: number;
  requiredCompleted: number;
  /** 0–100 remaining required work. */
  percentRemaining: number;
  isRequiredComplete: boolean;
  completedMilestoneIds: MilestoneId[];
  pendingMilestoneIds: MilestoneId[];
  statuses: MilestoneStatus[];
};

export type LifecycleEvaluationResult = {
  spaceType: SpaceType;
  profile: SetupProfile;
  lifecycle: LifecycleState;
  progress: SetupProgressSnapshot;
  recommendation: RecommendedAction | null;
  statuses: MilestoneStatus[];
};

/** Input to the single evaluate entry point. */
export type EvaluateSpaceLifecycleInput = {
  spaceId?: UUID;
  spaceType: SpaceType;
  context: PredicateContext;
};
