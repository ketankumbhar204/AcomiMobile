import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { accommodationApi } from '../api/accommodationApi';
import { mealsApi } from '../api/mealsApi';
import { memberApi } from '../api/memberApi';
import type { MemberResponse, SpacePermissionsResponse, SpaceType, UUID } from '../api/types';
import {
  emptyPredicateContext,
  needsPropertyStructure,
  type PredicateContext,
} from '../spaceLifecycle';
import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { subscribeDashboardInvalidation } from '../utils/dashboardQueryCache';
import { listPlannedMealTypes, summarizeDailyMenuDay } from '../utils/dailyMenuDayStatus';
import { fetchSpaceMenuCatalog } from '../utils/fetchSpaceMenuCatalog';
import { fetchDailyMenusByDateCached } from '../utils/mealDayQueryCache';
import { todayIsoDate } from '../utils/mealDates';
import { aggregateBuildingStructure } from '../utils/spaceSetupProgress';
import { servingLocationMode } from '../utils/servingLocationPolicy';
import { useBuildings } from './useBuildings';

/** Mess: only CUSTOMER counts toward “customers added”. Lodging: all members. */
function countLifecycleMembers(
  members: MemberResponse[] | null | undefined,
  spaceType: SpaceType,
): number {
  if (!Array.isArray(members)) {
    return 0;
  }
  if (spaceType === 'MESS') {
    return members.filter(m => m.role === 'CUSTOMER').length;
  }
  return members.length;
}

export type UseSpaceLifecycleSignalsArgs = {
  spaceId: UUID | null;
  spaceType: SpaceType | null | undefined;
  permissions: SpacePermissionsResponse;
  enabled: boolean;
  pendingActionCount: number;
  hasOperationalSignal: boolean;
  dismissedOptionalMilestoneIds?: readonly import('../spaceLifecycle').MilestoneId[];
};

export type UseSpaceLifecycleSignalsResult = {
  context: PredicateContext | null;
  loading: boolean;
  refresh: () => Promise<void>;
  needsPropertyStructure: boolean;
};

/**
 * Loads setup signals for the lifecycle engine without duplicating evaluation logic.
 * Skips heavy catalog/summary work when not needed for the current profile stage.
 * Mess today's-menu signals reuse mealDayQueryCache (deduped with DashboardMealOperations).
 * Refreshes on dashboard focus and after invalidateDashboardQueries (e.g. customer import).
 */
export function useSpaceLifecycleSignals({
  spaceId,
  spaceType,
  permissions,
  enabled,
  pendingActionCount,
  hasOperationalSignal,
  dismissedOptionalMilestoneIds = [],
}: UseSpaceLifecycleSignalsArgs): UseSpaceLifecycleSignalsResult {
  const accommodationApplicable = spaceType
    ? isAccommodationApplicable(spaceType)
    : true;
  const isMess = spaceType === 'MESS';
  const shouldLoad = Boolean(spaceId) && enabled && spaceType != null;

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
  const [hasMealLibrary, setHasMealLibrary] = useState(false);
  const [hasTodaysMenuPlanned, setHasTodaysMenuPlanned] = useState(false);
  const [hasMenuShared, setHasMenuShared] = useState(false);
  const [deliveryLocationCount, setDeliveryLocationCount] = useState(0);
  const [structure, setStructure] = useState({
    floors: 0,
    units: 0,
    rooms: 0,
    beds: 0,
  });
  const [extrasLoading, setExtrasLoading] = useState(false);
  /** Keep last signals visible while silently refreshing after import / focus. */
  const [hasLoadedExtras, setHasLoadedExtras] = useState(false);
  const [loadedSpaceId, setLoadedSpaceId] = useState<UUID | null>(null);
  const hasLoadedExtrasRef = useRef(false);

  // Drop previous-space signals immediately on space switch so UI never paints
  // stale lifecycle / health from the prior context.
  useEffect(() => {
    hasLoadedExtrasRef.current = false;
    setHasLoadedExtras(false);
    setLoadedSpaceId(null);
    if (shouldLoad) {
      setExtrasLoading(true);
    }
  }, [spaceId, shouldLoad]);

  const loadExtras = useCallback(async (options?: { silent?: boolean }) => {
    if (!spaceId || !shouldLoad || !spaceType) {
      setMemberCount(0);
      setHasMealLibrary(false);
      setHasTodaysMenuPlanned(false);
      setHasMenuShared(false);
      setDeliveryLocationCount(0);
      setStructure({ floors: 0, units: 0, rooms: 0, beds: 0 });
      hasLoadedExtrasRef.current = false;
      setHasLoadedExtras(false);
      setLoadedSpaceId(null);
      return;
    }

    const silent = options?.silent === true && hasLoadedExtrasRef.current;
    if (!silent) {
      setExtrasLoading(true);
    }
    try {
      const buildingIds =
        accommodationApplicable && buildingIdsKey.length > 0
          ? buildingIdsKey.split('|')
          : [];

      // Lodging with no buildings: members only (skip catalog + summaries).
      if (accommodationApplicable && buildingIds.length === 0) {
        const members = await memberApi.getMembers(spaceId).catch(() => []);
        setMemberCount(countLifecycleMembers(members, spaceType));
        setHasMealLibrary(false);
        setHasTodaysMenuPlanned(false);
        setHasMenuShared(false);
        setDeliveryLocationCount(0);
        setStructure({ floors: 0, units: 0, rooms: 0, beds: 0 });
        return;
      }

      const needsDelivery =
        isMess && servingLocationMode(spaceType) === 'delivery';

      const [members, catalog, summaries, deliveryLocations, todaysMenus] =
        await Promise.all([
          memberApi.getMembers(spaceId).catch(() => []),
          isMess || buildingIds.length > 0
            ? fetchSpaceMenuCatalog(spaceId).catch(() => null)
            : Promise.resolve(null),
          buildingIds.length > 0
            ? Promise.all(
                buildingIds.map(buildingId =>
                  accommodationApi
                    .getBuildingSummary(spaceId, buildingId)
                    .catch(() => null),
                ),
              )
            : Promise.resolve([]),
          needsDelivery
            ? mealsApi.getMealDeliveryLocationsManage(spaceId).catch(() => [])
            : Promise.resolve([]),
          isMess
            ? fetchDailyMenusByDateCached(spaceId, todayIsoDate()).catch(() => [])
            : Promise.resolve([]),
        ]);

      setMemberCount(countLifecycleMembers(members, spaceType));
      setHasMealLibrary(
        Boolean(
          catalog &&
            (catalog.items.some(item => item.isActive) ||
              catalog.combos.some(combo => combo.isActive)),
        ),
      );

      if (isMess) {
        const menus = Array.isArray(todaysMenus) ? todaysMenus : [];
        const summary = summarizeDailyMenuDay(menus);
        setHasTodaysMenuPlanned(listPlannedMealTypes(menus).length > 0);
        setHasMenuShared(summary.published > 0 || summary.modified > 0);
      } else {
        setHasTodaysMenuPlanned(false);
        setHasMenuShared(false);
      }

      setDeliveryLocationCount(
        Array.isArray(deliveryLocations) ? deliveryLocations.length : 0,
      );

      const validSummaries = summaries.filter(
        (summary): summary is NonNullable<typeof summary> => summary != null,
      );
      setStructure(
        validSummaries.length > 0
          ? aggregateBuildingStructure(validSummaries)
          : { floors: 0, units: 0, rooms: 0, beds: 0 },
      );
    } finally {
      hasLoadedExtrasRef.current = true;
      setLoadedSpaceId(spaceId);
      setHasLoadedExtras(true);
      setExtrasLoading(false);
    }
  }, [
    accommodationApplicable,
    buildingIdsKey,
    isMess,
    shouldLoad,
    spaceId,
    spaceType,
  ]);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  useFocusEffect(
    useCallback(() => {
      if (!shouldLoad) {
        return;
      }
      void loadExtras({ silent: true });
    }, [loadExtras, shouldLoad]),
  );

  useEffect(() => {
    if (!shouldLoad) {
      return undefined;
    }
    return subscribeDashboardInvalidation(() => {
      void loadExtras({ silent: true });
    });
  }, [loadExtras, shouldLoad]);

  const refresh = useCallback(async () => {
    await refreshBuildings();
    await loadExtras();
  }, [loadExtras, refreshBuildings]);

  const signalsReady = useMemo(() => {
    if (!shouldLoad || !spaceType || !spaceId) {
      return false;
    }
    if (accommodationApplicable && buildingsLoading && buildings.length === 0) {
      return false;
    }
    // Require a completed extras load for this space — never treat the
    // pre-fetch empty defaults as a ready lifecycle context.
    return hasLoadedExtras && loadedSpaceId === spaceId;
  }, [
    accommodationApplicable,
    buildings.length,
    buildingsLoading,
    hasLoadedExtras,
    loadedSpaceId,
    shouldLoad,
    spaceId,
    spaceType,
  ]);

  const context = useMemo((): PredicateContext | null => {
    if (!signalsReady || !spaceType) {
      return null;
    }
    return emptyPredicateContext(spaceType, permissions, {
      spaceExists: true,
      buildingCount: accommodationApplicable ? buildings.length : 0,
      floorCount: structure.floors,
      unitCount: structure.units,
      roomCount: structure.rooms,
      bedCount: structure.beds,
      memberCount,
      hasMealLibrary,
      hasTodaysMenuPlanned,
      hasMenuShared,
      deliveryLocationCount,
      pendingActionCount,
      // Mess: menu plan/share complete setup (READY); ACTIVE waits on real ops
      // signals from the dashboard (payments, etc.) — not menu alone.
      hasOperationalSignal,
      dismissedOptionalMilestoneIds,
    });
  }, [
    accommodationApplicable,
    buildings.length,
    deliveryLocationCount,
    dismissedOptionalMilestoneIds,
    hasMealLibrary,
    hasMenuShared,
    hasOperationalSignal,
    hasTodaysMenuPlanned,
    memberCount,
    pendingActionCount,
    permissions,
    signalsReady,
    spaceType,
    structure.beds,
    structure.floors,
    structure.rooms,
    structure.units,
  ]);

  const loading =
    shouldLoad &&
    ((accommodationApplicable && buildingsLoading && buildings.length === 0) ||
      (extrasLoading && !hasLoadedExtras));

  return {
    context,
    loading,
    refresh,
    needsPropertyStructure: context ? needsPropertyStructure(context) : false,
  };
}
