import { useCallback, useEffect, useMemo, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import { memberApi } from '../api/memberApi';
import type { SpaceType, UUID } from '../api/types';
import { useBuildings } from './useBuildings';
import {
  aggregateBuildingStructure,
  buildSpaceSetupProgress,
  type SpaceSetupProgress,
} from '../utils/spaceSetupProgress';
import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { fetchSpaceMenuCatalog } from '../utils/fetchSpaceMenuCatalog';

type UseSpaceSetupProgressResult = {
  progress: SpaceSetupProgress | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Lightweight setup checklist for owner dashboards.
 * Enabled only when the caller wants FTUE guidance (owner + incomplete setup).
 */
export function useSpaceSetupProgress(
  spaceId: UUID | null,
  spaceType: SpaceType | null | undefined,
  enabled: boolean,
): UseSpaceSetupProgressResult {
  const accommodationApplicable = spaceType
    ? isAccommodationApplicable(spaceType)
    : true;
  const shouldLoad = Boolean(spaceId) && enabled;

  const { buildings, loading: buildingsLoading, refresh: refreshBuildings } =
    useBuildings(spaceId, {
      enabled: shouldLoad && accommodationApplicable,
    });

  const buildingIdsKey = useMemo(
    () =>
      buildings
        .map(building => building.buildingId)
        .sort()
        .join('|'),
    [buildings],
  );

  const [memberCount, setMemberCount] = useState(0);
  const [hasMealConfig, setHasMealConfig] = useState(false);
  const [structure, setStructure] = useState({ floors: 0, rooms: 0, beds: 0 });
  const [extrasLoading, setExtrasLoading] = useState(false);

  const loadExtras = useCallback(async () => {
    if (!spaceId || !shouldLoad) {
      setMemberCount(0);
      setHasMealConfig(false);
      setStructure({ floors: 0, rooms: 0, beds: 0 });
      return;
    }

    setExtrasLoading(true);
    try {
      const buildingIds =
        accommodationApplicable && buildingIdsKey.length > 0
          ? buildingIdsKey.split('|')
          : [];

      // Empty property: only need the structure next-step — skip heavier catalog work.
      if (accommodationApplicable && buildingIds.length === 0) {
        const members = await memberApi.getMembers(spaceId).catch(() => []);
        setMemberCount(Array.isArray(members) ? members.length : 0);
        setHasMealConfig(false);
        setStructure({ floors: 0, rooms: 0, beds: 0 });
        return;
      }

      const [members, catalog, summaries] = await Promise.all([
        memberApi.getMembers(spaceId).catch(() => []),
        fetchSpaceMenuCatalog(spaceId).catch(() => null),
        buildingIds.length > 0
          ? Promise.all(
              buildingIds.map(buildingId =>
                accommodationApi
                  .getBuildingSummary(spaceId, buildingId)
                  .catch(() => null),
              ),
            )
          : Promise.resolve([]),
      ]);

      setMemberCount(Array.isArray(members) ? members.length : 0);
      setHasMealConfig(
        Boolean(
          catalog &&
            (catalog.items.some(item => item.isActive) ||
              catalog.combos.some(combo => combo.isActive)),
        ),
      );

      const validSummaries = summaries.filter(
        (summary): summary is NonNullable<typeof summary> => summary != null,
      );
      setStructure(
        validSummaries.length > 0
          ? aggregateBuildingStructure(validSummaries)
          : { floors: 0, rooms: 0, beds: 0 },
      );
    } finally {
      setExtrasLoading(false);
    }
  }, [accommodationApplicable, buildingIdsKey, shouldLoad, spaceId]);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  const refresh = useCallback(async () => {
    await refreshBuildings();
    await loadExtras();
  }, [loadExtras, refreshBuildings]);

  const progress = useMemo(() => {
    if (!shouldLoad) {
      return null;
    }
    // Wait for buildings before claiming "needs structure" — avoids flash/auto-nav races.
    if (accommodationApplicable && buildingsLoading && buildings.length === 0) {
      return null;
    }

    return buildSpaceSetupProgress({
      spaceType,
      buildingCount: accommodationApplicable ? buildings.length : 0,
      floors: structure.floors,
      rooms: structure.rooms,
      beds: structure.beds,
      memberCount,
      hasMealConfig,
    });
  }, [
    accommodationApplicable,
    buildings.length,
    buildingsLoading,
    hasMealConfig,
    memberCount,
    shouldLoad,
    spaceType,
    structure.beds,
    structure.floors,
    structure.rooms,
  ]);

  const loading =
    shouldLoad &&
    ((accommodationApplicable && buildingsLoading && buildings.length === 0) ||
      extrasLoading);

  return { progress, loading, refresh };
}
