import type { OccupancyResponse, OccupancyStatus } from '../api/types';
import { formatOccupancyAllocatedDate, getOccupancyExitDate } from './occupancyRules';
import type { StayChoice } from './shortStay';

export type MemberListStayDateSource = {
  status: Extract<OccupancyStatus, 'ACTIVE' | 'RESERVED'>;
  stayKind?: StayChoice | null;
  moveInDate?: string | null;
  actualMoveInAt?: string | null;
  expectedExitDate?: string | null;
  expectedCheckoutDate?: string | null;
};

export type MemberListStayDateInfo = {
  tone: 'reserved' | 'movedIn';
  moveInLabelKey: string;
  moveInValue: string;
  moveOutLabelKey: string;
  moveOutValue: string;
};

const DASH = '—';

/** Prefer ACTIVE occupancy, then RESERVED. Vacated rows are ignored for the list date row. */
export function preferredOccupancyForMemberListDates(
  memberId: string,
  activeRows: OccupancyResponse[],
  reservedRows: OccupancyResponse[],
): MemberListStayDateSource | null {
  const active = activeRows.find(row => row.memberId === memberId);
  if (active) {
    return toStayDateSource(active);
  }
  const reserved = reservedRows.find(row => row.memberId === memberId);
  return reserved ? toStayDateSource(reserved) : null;
}

function toStayDateSource(row: OccupancyResponse): MemberListStayDateSource | null {
  if (row.status !== 'ACTIVE' && row.status !== 'RESERVED') {
    return null;
  }
  return {
    status: row.status,
    stayKind: row.stayKind,
    moveInDate: row.moveInDate,
    actualMoveInAt: row.actualMoveInAt,
    expectedExitDate: row.expectedExitDate,
    expectedCheckoutDate: row.expectedCheckoutDate,
  };
}

/**
 * Builds move-in / move-out labels for the Members list card.
 * Uses only backend occupancy dates — no inferred calendar math.
 */
export function buildMemberListStayDateInfo(
  source: MemberListStayDateSource | null | undefined,
  t: (key: string, options?: { defaultValue?: string }) => string,
): MemberListStayDateInfo | null {
  if (!source) {
    return null;
  }

  const isReserved = source.status === 'RESERVED';
  const moveInRaw = isReserved
    ? source.moveInDate
    : source.actualMoveInAt ?? source.moveInDate;
  const exitRaw = getOccupancyExitDate(source);
  const openEnded = source.stayKind === 'OPEN_ENDED';
  const noFixedMoveOut = openEnded || !exitRaw?.trim();

  return {
    tone: isReserved ? 'reserved' : 'movedIn',
    moveInLabelKey: isReserved
      ? 'occupancy.section.plannedMoveIn'
      : 'occupancy.section.moveInDate',
    moveInValue: moveInRaw?.trim()
      ? formatOccupancyAllocatedDate(moveInRaw)
      : DASH,
    moveOutLabelKey: 'occupancy.section.expectedMoveOut',
    moveOutValue: noFixedMoveOut
      ? t('occupancy.section.noFixedDate', { defaultValue: 'No fixed date' })
      : formatOccupancyAllocatedDate(exitRaw),
  };
}
