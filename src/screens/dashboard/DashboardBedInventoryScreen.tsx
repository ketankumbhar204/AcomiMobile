import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, BedSpaceListItemResponse, UUID } from '../../api/types';
import { BedInventoryBrowser } from '../../components/dashboard/BedInventoryBrowser';
import { Screen } from '../../components/ui/Screen';
import { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';

type Route = {
  key: string;
  name: 'DashboardBedInventory';
  params: {
    spaceId: UUID;
    status: AccommodationStatus;
  };
};

type Nav = NativeStackNavigationProp<MainStackParamList, 'DashboardBedInventory'>;

export function DashboardBedInventoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, status } = route.params;

  const permissions = useSpacePermissions(spaceId);
  const canManageOccupancy = permissions.canManageOccupancy;
  const spaceType = permissions.spaceType ?? 'PG';

  const [refreshToken, setRefreshToken] = useState(0);

  const occupancyFlow = useAccommodationOccupancyFlow({
    spaceId,
    spaceType,
    canManage: canManageOccupancy,
    onSuccess: () => setRefreshToken(token => token + 1),
  });

  const buildOccupancyContext = useCallback((bed: BedSpaceListItemResponse) => {
    const target = buildBedOccupancyTarget({
      buildingId: bed.buildingId,
      buildingName: bed.buildingName,
      floorId: bed.floorId ?? undefined,
      floorName: bed.floorName ?? undefined,
      unitId: bed.unitId ?? undefined,
      unitName: bed.unitName ?? undefined,
      roomId: bed.roomId,
      roomName: bed.roomName,
      bedId: bed.bedId,
      bedName: bed.label,
    });
    return {
      target,
      accommodationStatus: bed.status,
      occupancy: null,
    };
  }, []);

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

  const handleAllocate = useCallback(
    (bed: BedSpaceListItemResponse) => {
      occupancyFlow.startWalkIn(buildOccupancyContext(bed));
    },
    [buildOccupancyContext, occupancyFlow],
  );

  const handleReserve = useCallback(
    (bed: BedSpaceListItemResponse) => {
      occupancyFlow.startReserve(buildOccupancyContext(bed));
    },
    [buildOccupancyContext, occupancyFlow],
  );

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      <BedInventoryBrowser
        spaceId={spaceId}
        spaceType={spaceType}
        status={status}
        flowAction="dashboard"
        canManageOccupancy={canManageOccupancy}
        onBedPress={handleBedPress}
        onAllocate={handleAllocate}
        onReserve={handleReserve}
        refreshTrigger={refreshToken}
        subtitle={
          status === 'AVAILABLE'
            ? t('dashboard.drilldown.vacantBedsSubtitle')
            : t('dashboard.drilldown.occupiedBedsSubtitle')
        }
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
    paddingTop: 0,
    flex: 1,
  },
});
