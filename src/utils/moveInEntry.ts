/**
 * Move In starts on the vacant-bed list. The allocation form opens only after
 * an available bed is chosen. Reserve, transfer, and vacate keep their own flows.
 */
export function allocateNeedsVacantBedPick(
  mode: string,
  ids?: { bedId?: string | null; unitId?: string | null },
): boolean {
  if (mode !== 'ALLOCATE') {
    return false;
  }
  return !ids?.bedId && !ids?.unitId;
}

export function bedIsSelectableForMoveIn(status: string | null | undefined): boolean {
  return status === 'AVAILABLE';
}
