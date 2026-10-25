import type { MemberOccupancyStatus, MembershipRole } from '../api/types';
import { formatPaymentStayLabel, type StayLayoutMode } from './stayTrail';

type MemberStaySource = {
  role?: MembershipRole | null;
  occupancyStatus?: MemberOccupancyStatus | null;
  stayLabel?: string | null;
};

export type MemberStayParts = {
  occupancyId?: string | null;
  memberId: string;
  buildingId?: string | null;
  status?: string | null;
  vacatedAt?: string | null;
  buildingName?: string | null;
  floorName?: string | null;
  unitName?: string | null;
  roomName?: string | null;
  bedName?: string | null;
};

export type MemberStayOptions = {
  multipleBuildings?: boolean;
  layoutByBuildingId?: ReadonlyMap<string, StayLayoutMode>;
};

/** Same trail as payment cards: Building → Floor → Unit → Room → Bed. */
export function formatMemberStayLine(
  parts: Omit<MemberStayParts, 'memberId' | 'status' | 'vacatedAt'> | null | undefined,
  options?: MemberStayOptions,
): string | null {
  if (!parts) {
    return null;
  }
  const layoutMode = parts.buildingId
    ? options?.layoutByBuildingId?.get(parts.buildingId)
    : undefined;
  return formatPaymentStayLabel({
    multipleBuildings: options?.multipleBuildings === true,
    layoutMode,
    buildingName: parts.buildingName,
    floorName: parts.floorName,
    unitName: parts.unitName,
    roomName: parts.roomName,
    bedName: parts.bedName,
  });
}

/** Active stay wins. Otherwise the latest vacated stay. Missing levels are omitted. */
export function stayLabelForMember(
  memberId: string,
  rows: MemberStayParts[],
  options?: MemberStayOptions,
): string | null {
  const mine = rows.filter(row => row.memberId === memberId);
  const active = mine.find(row => row.status === 'ACTIVE');
  const vacated = mine
    .filter(row => row.status === 'VACATED')
    .sort((left, right) => (right.vacatedAt ?? '').localeCompare(left.vacatedAt ?? ''))[0];
  return formatMemberStayLine(active ?? vacated, options);
}

export type StayTrailIndex = {
  byOccupancyId: ReadonlyMap<string, string>;
  byMemberId: ReadonlyMap<string, string>;
};

/** One label per occupancy, and one current label per member. */
export function buildStayTrailIndex(
  rows: MemberStayParts[],
  options?: MemberStayOptions,
): StayTrailIndex {
  const byOccupancyId = new Map<string, string>();
  rows.forEach(row => {
    const label = formatMemberStayLine(row, options);
    if (row.occupancyId && label) {
      byOccupancyId.set(row.occupancyId, label);
    }
  });
  const byMemberId = new Map<string, string>();
  new Set(rows.map(row => row.memberId)).forEach(memberId => {
    const label = stayLabelForMember(memberId, rows, options);
    if (label) {
      byMemberId.set(memberId, label);
    }
  });
  return { byOccupancyId, byMemberId };
}

/** Payment rows prefer the occupancy on the payment, then the member's current stay. */
export function stayLabelFromIndex(
  index: StayTrailIndex | null | undefined,
  source: { occupancyId?: string | null; memberId?: string | null },
): string | null {
  if (!index) {
    return null;
  }
  if (source.occupancyId) {
    const exact = index.byOccupancyId.get(source.occupancyId);
    if (exact) {
      return exact;
    }
  }
  if (source.memberId) {
    return index.byMemberId.get(source.memberId) ?? null;
  }
  return null;
}

/**
 * Location is shown for a moved-in or vacated tenant when a real stay exists.
 * Reserved tenants and blank trails render nothing.
 */
export function memberListStayLabel(
  member: MemberStaySource,
  resolvedStay?: string | null,
): string | null {
  if (
    member.role !== 'TENANT' ||
    (member.occupancyStatus !== 'ALLOCATED' && member.occupancyStatus !== 'VACATED')
  ) {
    return null;
  }
  const label = (resolvedStay ?? member.stayLabel)?.trim();
  return label ? label : null;
}
