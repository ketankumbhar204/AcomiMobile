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
import { spacing } from '../../theme';
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
    status: 'AVAILABLE' | 'OCCUPIED';
    focus?: PropertyOpsFocus;
    intent?: 'allocate';
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
        mode: 'ALLOCATE',
        bedId: bed.bedId,
        roomId: bed.roomId,
        unitId: bed.unitId ?? undefined,
        buildingId: bed.buildingId,
      });
    },
    [canManageOccupancy, navigation, spaceId],
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

  const screenTitle =
    opsFocus === 'moveIns'
      ? t('dashboard.drilldown.moveInsTitle')
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
        flowAction={selectingForAllocate && canManageOccupancy ? 'allocate' : 'dashboard'}
        onFlowAction={selectingForAllocate && canManageOccupancy ? handleAllocateBed : undefined}
        canManageOccupancy={canManageOccupancy}
        onBedPress={selectingForAllocate ? () => undefined : handleBedPress}
        onEditBed={canManage ? bed => bedInteraction.open(persistedTargetFromSpaceBed(bed)) : undefined}
        refreshTrigger={refreshToken}
        showSubtitle={false}
        headerAccessory={
          showOpsCards && dashboard.accommodationOperations ? (
            <DashboardAccommodationOperations
              hideTitle
              operations={dashboard.accommodationOperations}
              selectedMetricId={opsFocus}
              onOccupiedPress={() => switchFocus('occupied')}
              onVacantPress={() => switchFocus('vacant')}
              onMoveInsPress={() => switchFocus('moveIns')}
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
    padding: spacing.xxl,
    paddingTop: spacing.md,
    flex: 1,
  },
});
