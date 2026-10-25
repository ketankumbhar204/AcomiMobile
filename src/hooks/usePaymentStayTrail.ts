import { useEffect, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import { occupancyApi } from '../api/occupancyApi';
import type { OccupancyResponse } from '../api/types';
import { formatPaymentStayLabel, formatStayTrail, type StayLayoutMode } from '../utils/stayTrail';

type PaymentStaySource = {
  occupancyId?: string | null;
  memberId?: string | null;
  targetLabel?: string | null;
};

type StayParts = {
  buildingId?: string | null;
  buildingName?: string | null;
  floorName?: string | null;
  unitName?: string | null;
  roomName?: string | null;
  bedName?: string | null;
};

const trailCache = new Map<string, string>();

function cacheKey(spaceId: string, occupancyId: string): string {
  return `${spaceId}:${occupancyId}`;
}

function labelFromParts(parts: StayParts, layoutMode?: StayLayoutMode | null): string | null {
  return formatStayTrail(
    formatPaymentStayLabel({
      layoutMode,
      buildingName: parts.buildingName,
      floorName: parts.floorName,
      unitName: parts.unitName,
      roomName: parts.roomName,
      bedName: parts.bedName,
    }),
  );
}

async function loadStayParts(
  spaceId: string,
  occupancyId: string,
  memberId?: string | null,
): Promise<StayParts | null> {
  try {
    return await occupancyApi.getOccupancy(spaceId, occupancyId);
  } catch {
    if (!memberId) {
      return null;
    }
    try {
      const list = await occupancyApi.getMemberOccupancies(spaceId, memberId);
      const rows = [list.currentOccupancy, list.reservedOccupancy, ...(list.occupancies ?? [])].filter(
        (row): row is OccupancyResponse => row != null,
      );
      return rows.find(row => row.occupancyId === occupancyId) ?? list.currentOccupancy;
    } catch {
      return null;
    }
  }
}

/**
 * Payment stay line. Building → Floor → Unit → Room → Bed, same as the members list.
 * Members can read their own occupancy; the space-wide list is not required.
 */
export function usePaymentStayTrail(
  spaceId: string | null | undefined,
  payment: PaymentStaySource | null | undefined,
): string | null {
  const fallback = formatStayTrail(payment?.targetLabel);
  const cached =
    spaceId && payment?.occupancyId
      ? trailCache.get(cacheKey(spaceId, payment.occupancyId)) ?? null
      : null;
  const [trail, setTrail] = useState<string | null>(cached ?? fallback);

  useEffect(() => {
    const nextFallback = formatStayTrail(payment?.targetLabel);
    if (!spaceId || !payment?.occupancyId) {
      setTrail(nextFallback);
      return;
    }
    const key = cacheKey(spaceId, payment.occupancyId);
    const hit = trailCache.get(key);
    if (hit) {
      setTrail(hit);
      return;
    }
    let cancelled = false;
    void Promise.all([
      loadStayParts(spaceId, payment.occupancyId, payment.memberId),
      accommodationApi.getBuildings(spaceId).catch(() => []),
    ])
      .then(([occupancy, buildings]) => {
        if (cancelled) {
          return;
        }
        if (!occupancy) {
          setTrail(nextFallback);
          return;
        }
        const layoutMode = buildings.find(
          building => building.buildingId === occupancy.buildingId && building.active !== false,
        )?.layoutMode;
        const built = labelFromParts(occupancy, layoutMode) ?? nextFallback;
        if (built) {
          trailCache.set(key, built);
        }
        setTrail(built);
      })
      .catch(() => {
        if (!cancelled) {
          setTrail(nextFallback);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payment?.memberId, payment?.occupancyId, payment?.targetLabel, spaceId]);

  return trail;
}
