/** Block the wizard only when the first step needs a member or occupancy record. */
export function shouldBlockOccupancyWizardBoot(input: {
  memberId?: string;
  occupancyId?: string;
}): boolean {
  return Boolean(input.memberId || input.occupancyId);
}

/** The bed modal already has rent, deposit, and location. Do not fetch them again. */
export function shouldRefetchAllocationTarget(input: {
  bedId?: string;
  unitId?: string;
  catalogKnown?: boolean;
}): boolean {
  return Boolean((input.bedId || input.unitId) && !input.catalogKnown);
}
