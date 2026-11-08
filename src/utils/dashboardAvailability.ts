/**
 * Availability % for the owner property overview ring.
 * Uses available inventory ÷ total inventory — never occupancy %.
 */
export function computeAvailabilityPercent(
  available: number,
  total: number,
): number {
  if (!Number.isFinite(available) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  const safeAvailable = Math.max(0, available);
  return Math.max(0, Math.min(100, Math.round((safeAvailable / total) * 100)));
}

/** Prefer structure total; fall back to status-sum when structure is empty. */
export function resolveInventoryTotal(input: {
  structureTotal?: number | null;
  occupied: number;
  available: number;
  reserved: number;
}): number {
  const structure = input.structureTotal ?? 0;
  if (structure > 0) {
    return structure;
  }
  return Math.max(0, input.occupied) + Math.max(0, input.available) + Math.max(0, input.reserved);
}
