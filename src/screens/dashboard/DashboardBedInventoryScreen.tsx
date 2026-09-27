import React, { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BedDouble, BedSingle } from 'lucide-react-native';
import type { AccommodationStatus, BedSpaceListItemResponse, UUID } from '../../api/types';
import { PersistedBedInteractionHost } from '../../components/accommodation/PersistedBedInteractionHost';
import { BedInventoryBrowser } from '../../components/dashboard/BedInventoryBrowser';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { Screen } from '../../components/ui/Screen';
import { usePersistedBedInteraction } from '../../hooks/usePersistedBedInteraction';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { persistedTargetFromSpaceBed } from '../../utils/persistedBedTarget';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';

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

  const isVacant = status === 'AVAILABLE';
  const screenTitle = isVacant
    ? t('dashboard.drilldown.vacantBedsTitle')
    : t('dashboard.drilldown.occupiedBedsTitle');

  useLayoutEffect(() => {
    navigation.setOptions({ title: screenTitle });
  }, [navigation, screenTitle]);

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      <BedInventoryBrowser
        spaceId={spaceId}
        spaceType={spaceType}
        status={status}
        flowAction="dashboard"
        canManageOccupancy={canManageOccupancy}
        onBedPress={handleBedPress}
        onEditBed={canManage ? bed => bedInteraction.open(persistedTargetFromSpaceBed(bed)) : undefined}
        refreshTrigger={refreshToken}
        showSubtitle={false}
        headerAccessory={
          <MealFormHero
            icon={isVacant ? BedSingle : BedDouble}
            heading={screenTitle}
          />
        }
      />
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
