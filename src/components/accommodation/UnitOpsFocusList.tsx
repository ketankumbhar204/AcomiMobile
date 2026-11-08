import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type { AccommodationStatus, UUID, UnitListItemResponse } from '../../api/types';
import type { MainStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { occupancyPercentFromStatus } from './layout/cards/occupancyUtils';
import { EmptyState } from '../ui';
import {
  InventoryListingCard,
  InventoryListingCardGrid,
} from './InventoryListingCard';

type UnitRow = UnitListItemResponse & {
  buildingId: UUID;
  buildingName: string;
};

type UnitOpsFocusListProps = {
  spaceId: UUID;
  status?: AccommodationStatus;
  /** When set, only these units are listed. An empty set shows the empty state. */
  unitIds?: ReadonlySet<string> | null;
  onAllocate?: (unit: UnitRow) => void;
};

export function UnitOpsFocusList({
  spaceId,
  status,
  unitIds,
  onAllocate,
}: UnitOpsFocusListProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void accommodationApi
      .getBuildings(spaceId)
      .then(async buildings => {
        const pages = await Promise.all(
          buildings.map(async building => {
            const page = await accommodationApi.listUnits(spaceId, building.buildingId, {
              page: 0,
              size: 100,
              includeSynthetic: false,
            });
            return page.content.map(unit => ({
              ...unit,
              buildingId: building.buildingId,
              buildingName: building.name,
            }));
          }),
        );
        if (!cancelled) {
          setUnits(pages.flat());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnits([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const visible = units.filter(unit => {
    if (unit.active === false) {
      return false;
    }
    if (unitIds && !unitIds.has(unit.unitId)) {
      return false;
    }
    if (status && unit.status !== status) {
      return false;
    }
    return true;
  });

  const openUnit = (unit: UnitRow) => {
    if (onAllocate) {
      onAllocate(unit);
      return;
    }
    navigation.navigate('UnitDetail', {
      spaceId,
      buildingId: unit.buildingId,
      unitId: unit.unitId,
      buildingName: unit.buildingName,
    });
  };

  if (loading) {
    return null;
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        title={t('accommodation.units.emptyTitle', { defaultValue: 'No units' })}
        description={t('accommodation.units.emptyFiltered', {
          defaultValue: 'No units match this view.',
        })}
      />
    );
  }

  return (
    <View style={styles.list}>
      <InventoryListingCardGrid
        items={visible}
        keyExtractor={unit => unit.unitId}
        renderCard={unit => {
          const inactive = !isAccommodationEntityActive(unit);
          return (
            <InventoryListingCard
              kind="unit"
              title={unit.name}
              subtitle={unit.buildingName}
              status={inactive ? null : unit.status}
              inactive={inactive}
              occupancyPercent={inactive ? 0 : occupancyPercentFromStatus(unit.status)}
              onPressDetails={() => openUnit(unit)}
              onPressCard={() => openUnit(unit)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
});
