import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { BedSpaceListItemResponse, UUID } from '../../api/types';
import { PersistedBedInteractionHost } from '../../components/accommodation/PersistedBedInteractionHost';
import { BedInventoryBrowser } from '../../components/dashboard/BedInventoryBrowser';
import {
  BedInventoryFaceProvider,
  type MoveInBedFace,
} from '../../components/dashboard/bedInventoryFace';
import { DashboardAccommodationOperations } from '../../components/dashboard/DashboardAccommodationOperations';
import { Screen } from '../../components/ui/Screen';
import { usePersistedBedInteraction } from '../../hooks/usePersistedBedInteraction';
import { useSpaceDashboard } from '../../hooks/useSpaceDashboard';
import { useSpaceOccupancyList } from '../../hooks/useSpaceOccupancyList';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { pageContentGutter, spacing } from '../../theme';
import { UnitOpsFocusList } from '../../components/accommodation/UnitOpsFocusList';
import { useUnitLevelOccupancyCounts } from '../../hooks/useUnitLevelOccupancyCounts';
import { getAccommodationUiProfile, usesUnitLevelOccupancy } from '../../utils/accommodationProfile';
import { applyUnitOccupancyCounts } from '../../utils/unitLevelOccupancy';
import { bedIsSelectableForMoveIn } from '../../utils/moveInEntry';
import { persistedTargetFromSpaceBed } from '../../utils/persistedBedTarget';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import {
  bedStatusForPropertyOpsFocus,
  propertyOpsFocusFromInventory,
  type PropertyOpsFocus,
} from '../../utils/propertyOpsFocus';

type Route = {
  key: string;
  name: 'DashboardBedInventory';
  params: {
    spaceId: UUID;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    focus?: PropertyOpsFocus;
    intent?: 'allocate' | 'reserve';
  };
};

type Nav = NativeStackNavigationProp<MainStackParamList, 'DashboardBedInventory'>;

export function DashboardBedInventoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, status, intent, focus: focusParam } = route.params;
  const opsFocus = propertyOpsFocusFromInventory(status, focusParam);
  const selectingForAllocate = intent === 'allocate' && opsFocus === 'vacant';
  const selectingForReserve = intent === 'reserve' && opsFocus === 'vacant';
  const selectingVacantForWizard = selectingForAllocate || selectingForReserve;
  const wizardMode = selectingForReserve ? 'RESERVE' : 'ALLOCATE';
  const flowAction = selectingForReserve
    ? 'reserve'
    : selectingForAllocate
      ? 'allocate'
      : 'dashboard';

  const permissions = useSpacePermissions(spaceId);
  const canManageOccupancy = permissions.canManageOccupancy;
  const canManage = permissions.canManageAccommodation;
  const spaceType = permissions.spaceType ?? 'PG';

  const [refreshToken, setRefreshToken] = useState(0);

  const bedInteraction = usePersistedBedInteraction({
    spaceId,
    spaceType,
    canEditStructure: canManage,
    canManageOccupancy,
    onSuccess: async () => {
      invalidateAccommodationQueries();
      setRefreshToken(token => token + 1);
    },
  });

  const skipFocusRefresh = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefresh.current) {
        skipFocusRefresh.current = false;
        return;
      }
      setRefreshToken(token => token + 1);
    }, []),
  );

  const handleAllocateBed = useCallback(
    (bed: BedSpaceListItemResponse) => {
      if (!canManageOccupancy || !bedIsSelectableForMoveIn(bed.status)) {
        return;
      }
      navigation.navigate('OccupancyWizard', {
        spaceId,
        mode: wizardMode,
        bedId: bed.bedId,
        roomId: bed.roomId,
        unitId: bed.unitId ?? undefined,
        buildingId: bed.buildingId,
      });
    },
    [canManageOccupancy, navigation, spaceId, wizardMode],
  );

  const handleBedPress = useCallback(
    (bed: BedSpaceListItemResponse) => {
      navigation.navigate('BedDetail', {
        spaceId,
        buildingId: bed.buildingId,
        roomId: bed.roomId,
        bedId: bed.bedId,
        buildingName: bed.buildingName,
        parentName: bed.unitName ?? bed.floorName ?? undefined,
        parentType: bed.unitId ? 'unit' : 'floor',
        floorId: bed.floorId ?? undefined,
        unitId: bed.unitId ?? undefined,
        roomName: bed.roomName,
        bedLabel: bed.label,
      });
    },
    [navigation, spaceId],
  );

  const knownSpaceType = permissions.spaceType;
  const showOpsCards = knownSpaceType != null && knownSpaceType !== 'MESS' && opsFocus != null;
  const dashboard = useSpaceDashboard(spaceId, knownSpaceType, showOpsCards);
  const moveIns = useSpaceOccupancyList({
    spaceId,
    mode: 'moveInsThisMonth',
    enabled: showOpsCards && opsFocus === 'moveIns',
  });
  const moveInsByBedId = useMemo(() => {
    const map = new Map<string, MoveInBedFace>();
    if (opsFocus !== 'moveIns') {
      return map;
    }
    for (const row of moveIns.items) {
      if (!row.bedId) {
        continue;
      }
      map.set(row.bedId, {
        memberName: row.memberName,
        moveInDate: row.moveInDate ?? row.actualMoveInAt?.slice(0, 10) ?? null,
        rent: row.rentSnapshot ?? null,
        deposit: row.depositSnapshot ?? null,
        stayKind: row.stayKind ?? null,
      });
    }
    return map;
  }, [moveIns.items, opsFocus]);
  const moveInBedIds = useMemo(() => {
    if (opsFocus !== 'moveIns') {
      return null;
    }
    return new Set(moveInsByBedId.keys());
  }, [moveInsByBedId, opsFocus]);

  const unitLevel = usesUnitLevelOccupancy(getAccommodationUiProfile(spaceType));
  const unitOccupancy = useUnitLevelOccupancyCounts(spaceId, unitLevel);
  const displayOperations =
    unitLevel && dashboard.accommodationOperations && unitOccupancy.counts
      ? applyUnitOccupancyCounts(dashboard.accommodationOperations, unitOccupancy.counts)
      : dashboard.accommodationOperations;
  const moveInUnitIds = useMemo(() => {
    if (!unitLevel || opsFocus !== 'moveIns') {
      return null;
    }
    return new Set(
      moveIns.items.map(row => row.unitId).filter((id): id is string => Boolean(id)),
    );
  }, [moveIns.items, opsFocus, unitLevel]);

  const screenTitle =
    opsFocus === 'moveIns'
      ? t('dashboard.drilldown.moveInsTitle')
      : opsFocus === 'reserved'
        ? t('dashboard.drilldown.reservedBedsTitle', {
            defaultValue: unitLevel ? 'Reserved units' : 'Reserved beds',
          })
      : unitLevel && opsFocus === 'occupied'
        ? t('dashboard.accommodationOperations.occupiedUnits', { defaultValue: 'Occupied units' })
        : unitLevel
          ? t('dashboard.accommodationOperations.availableUnits', { defaultValue: 'Available units' })
        : opsFocus === 'occupied'
          ? t('dashboard.drilldown.occupiedBedsTitle')
          : t('dashboard.drilldown.vacantBedsTitle');

  const switchFocus = useCallback(
    (next: PropertyOpsFocus) => {
      if (next === opsFocus) {
        return;
      }
      navigation.setParams({
        status: bedStatusForPropertyOpsFocus(next),
        focus: next,
        intent: next === 'vacant' ? intent : undefined,
      });
    },
    [intent, navigation, opsFocus],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: screenTitle });
  }, [navigation, screenTitle]);

  if (unitLevel) {
    return (
      <Screen scrollable style={styles.screen} contentStyle={styles.content}>
        {showOpsCards && displayOperations ? (
          <DashboardAccommodationOperations
            hideTitle
            occupancyEntity="units"
            operations={displayOperations}
            selectedMetricId={opsFocus}
            onOccupiedPress={() => switchFocus('occupied')}
            onVacantPress={() => switchFocus('vacant')}
            onReservedPress={() => switchFocus('reserved')}
          />
        ) : null}
        <UnitOpsFocusList
          spaceId={spaceId}
          status={
            opsFocus === 'moveIns'
              ? undefined
              : opsFocus === 'occupied'
                ? 'OCCUPIED'
                : opsFocus === 'reserved'
                  ? 'RESERVED'
                  : 'AVAILABLE'
          }
          unitIds={moveInUnitIds}
          onAllocate={
            selectingVacantForWizard && canManageOccupancy
              ? unit =>
                  navigation.navigate('OccupancyWizard', {
                    spaceId,
                    mode: wizardMode,
                    unitId: unit.unitId,
                    buildingId: unit.buildingId,
                  })
              : undefined
          }
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      <BedInventoryFaceProvider moveInsByBedId={moveInsByBedId}>
      <BedInventoryBrowser
        spaceId={spaceId}
        spaceType={spaceType}
        status={opsFocus === 'moveIns' ? 'OCCUPIED' : status}
        opsFocus={opsFocus}
        bedIdAllowList={moveInBedIds}
        listPending={opsFocus === 'moveIns' && moveIns.loading && moveIns.items.length === 0}
        flowAction={selectingVacantForWizard && canManageOccupancy ? flowAction : 'dashboard'}
        onFlowAction={selectingVacantForWizard && canManageOccupancy ? handleAllocateBed : undefined}
        canManageOccupancy={canManageOccupancy}
        onBedPress={selectingVacantForWizard ? () => undefined : handleBedPress}
        onEditBed={canManage ? bed => bedInteraction.open(persistedTargetFromSpaceBed(bed)) : undefined}
        refreshTrigger={refreshToken}
        showSubtitle={false}
        unifiedScroll
        headerAccessory={
          showOpsCards && displayOperations ? (
            <DashboardAccommodationOperations
              hideTitle
              operations={displayOperations}
              selectedMetricId={opsFocus}
              onOccupiedPress={() => switchFocus('occupied')}
              onVacantPress={() => switchFocus('vacant')}
              onReservedPress={() => switchFocus('reserved')}
            />
          ) : null
        }
      />
      </BedInventoryFaceProvider>
      <PersistedBedInteractionHost
        interaction={bedInteraction}
        spaceId={spaceId}
        spaceType={spaceType}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: pageContentGutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});
