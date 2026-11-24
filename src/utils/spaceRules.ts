import type { RuleAssignment, SpaceType } from '../api/types';

export const MAX_SPACE_RULES = 30;
export const MAX_RULE_TEXT_LENGTH = 500;

export type RuleCode =
  | 'NO_SMOKING'
  | 'NO_ALCOHOL'
  | 'NO_PETS'
  | 'VISITOR_HOURS'
  | 'CLEANLINESS'
  | 'NO_LOUD_MUSIC'
  | 'RENT_DUE_DATE'
  | 'GATE_CLOSING'
  | 'ID_PROOF_REQUIRED'
  | 'NO_COOKING'
  | 'LAUNDRY_RULES'
  | 'PARKING_RULES'
  | 'FOOD_WASTE'
  | 'MEAL_TIMINGS'
  | 'SUBSCRIPTION_PAYMENT'
  | 'HYGIENE'
  | 'CUSTOM';

type PresetRule = {
  code: Exclude<RuleCode, 'CUSTOM'>;
  defaultLabel: string;
};

const SHARED_STAY_RULES: PresetRule[] = [
  { code: 'NO_SMOKING', defaultLabel: 'No smoking on the premises' },
  { code: 'NO_ALCOHOL', defaultLabel: 'No alcohol on the premises' },
  { code: 'NO_PETS', defaultLabel: 'Pets not allowed on the premises' },
  { code: 'VISITOR_HOURS', defaultLabel: 'Visitors allowed only during permitted hours' },
  { code: 'CLEANLINESS', defaultLabel: 'Maintain cleanliness in rooms and common areas' },
  { code: 'NO_LOUD_MUSIC', defaultLabel: 'No loud music or disturbances' },
  { code: 'RENT_DUE_DATE', defaultLabel: 'Rent must be paid on or before the agreed due date' },
  { code: 'GATE_CLOSING', defaultLabel: 'Gate closes at the notified time' },
  { code: 'ID_PROOF_REQUIRED', defaultLabel: 'Valid government ID proof is required at move-in' },
];

const RENTAL_RULES: PresetRule[] = [
  { code: 'NO_SMOKING', defaultLabel: 'No smoking inside the property' },
  { code: 'NO_PETS', defaultLabel: 'Pets not allowed unless agreed in writing' },
  { code: 'CLEANLINESS', defaultLabel: 'Keep the property clean and undamaged' },
  { code: 'RENT_DUE_DATE', defaultLabel: 'Rent must be paid on or before the agreed due date' },
  { code: 'PARKING_RULES', defaultLabel: 'Park only in allocated parking spaces' },
  { code: 'ID_PROOF_REQUIRED', defaultLabel: 'Valid government ID proof is required at move-in' },
];

const CORPORATE_RULES: PresetRule[] = [
  { code: 'NO_SMOKING', defaultLabel: 'No smoking on the premises' },
  { code: 'VISITOR_HOURS', defaultLabel: 'Visitors allowed only during permitted hours' },
  { code: 'CLEANLINESS', defaultLabel: 'Maintain cleanliness in rooms and common areas' },
  { code: 'NO_LOUD_MUSIC', defaultLabel: 'No loud music or disturbances' },
  { code: 'ID_PROOF_REQUIRED', defaultLabel: 'Valid government ID / company ID is required' },
  { code: 'PARKING_RULES', defaultLabel: 'Park only in allocated parking spaces' },
];

const MESS_RULES: PresetRule[] = [
  { code: 'MEAL_TIMINGS', defaultLabel: 'Follow notified meal timings' },
  { code: 'FOOD_WASTE', defaultLabel: 'Do not waste food; follow mess serving rules' },
  { code: 'HYGIENE', defaultLabel: 'Maintain personal and dining-area hygiene' },
  { code: 'SUBSCRIPTION_PAYMENT', defaultLabel: 'Keep meal subscription payments up to date' },
  { code: 'NO_SMOKING', defaultLabel: 'No smoking in the dining area' },
];

const RULES_BY_TYPE: Record<SpaceType, PresetRule[]> = {
  PG: SHARED_STAY_RULES,
  HOSTEL: [
    ...SHARED_STAY_RULES,
    { code: 'NO_COOKING', defaultLabel: 'Cooking outside designated areas is not allowed' },
    { code: 'LAUNDRY_RULES', defaultLabel: 'Use laundry facilities as per the house schedule' },
  ],
  CO_LIVING: SHARED_STAY_RULES,
  RENTAL: RENTAL_RULES,
  CORPORATE_STAY: CORPORATE_RULES,
  MESS: MESS_RULES,
};

export function supportsSpaceRules(spaceType: SpaceType | null | undefined): boolean {
  return spaceType != null;
}

export function presetRulesForSpaceType(spaceType: SpaceType | null | undefined): PresetRule[] {
  if (!spaceType) {
    return [];
  }
  return RULES_BY_TYPE[spaceType] ?? [];
}

export function resolvePresetRuleLabel(
  code: string,
  spaceType: SpaceType | null | undefined,
): string {
  const match = presetRulesForSpaceType(spaceType).find(rule => rule.code === code);
  return match?.defaultLabel ?? code;
}

export function ruleKey(rule: RuleAssignment): string {
  if (rule.code === 'CUSTOM') {
    return `CUSTOM::${rule.label.trim().toLowerCase()}`;
  }
  return rule.code;
}

export function normalizeRuleAssignments(rules: RuleAssignment[] | null | undefined): RuleAssignment[] {
  if (!rules?.length) {
    return [];
  }
  const normalized: RuleAssignment[] = [];
  const seen = new Set<string>();
  for (const raw of rules) {
    if (!raw?.code?.trim()) {
      continue;
    }
    const code = raw.code.trim().toUpperCase();
    const label = (raw.label ?? '').trim();
    if (!label) {
      continue;
    }
    if (label.length > MAX_RULE_TEXT_LENGTH) {
      continue;
    }
    const assignment: RuleAssignment = { code, label };
    const key = ruleKey(assignment);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(assignment);
    if (normalized.length >= MAX_SPACE_RULES) {
      break;
    }
  }
  return normalized;
}

/**
 * Merge saved space rules with type suggestions for the editor.
 * Saved selections/edits win; changing space type does not wipe saved rows.
 */
export function buildEditableRuleRows(
  spaceType: SpaceType | null | undefined,
  saved: RuleAssignment[],
): Array<{
  code: string;
  label: string;
  selected: boolean;
  isCustom: boolean;
  defaultLabel: string;
}> {
  const normalizedSaved = normalizeRuleAssignments(saved);
  const byCode = new Map<string, RuleAssignment>();
  const customs: RuleAssignment[] = [];
  for (const rule of normalizedSaved) {
    if (rule.code === 'CUSTOM') {
      customs.push(rule);
    } else {
      byCode.set(rule.code, rule);
    }
  }

  const presets = presetRulesForSpaceType(spaceType).map(preset => {
    const savedRule = byCode.get(preset.code);
    return {
      code: preset.code,
      label: savedRule?.label ?? preset.defaultLabel,
      selected: savedRule != null,
      isCustom: false,
      defaultLabel: preset.defaultLabel,
    };
  });

  // Keep saved preset codes that are not in the current type catalog (type change).
  const knownCodes = new Set(presets.map(row => row.code));
  for (const [code, rule] of byCode) {
    if (!knownCodes.has(code)) {
      presets.push({
        code,
        label: rule.label,
        selected: true,
        isCustom: false,
        defaultLabel: rule.label,
      });
    }
  }

  const customRows = customs.map(rule => ({
    code: 'CUSTOM',
    label: rule.label,
    selected: true,
    isCustom: true,
    defaultLabel: rule.label,
  }));

  return [...presets, ...customRows];
}

export function selectedRulesFromEditableRows(
  rows: Array<{ code: string; label: string; selected: boolean }>,
): RuleAssignment[] {
  return normalizeRuleAssignments(
    rows
      .filter(row => row.selected)
      .map(row => ({ code: row.code, label: row.label.trim() })),
  );
}
