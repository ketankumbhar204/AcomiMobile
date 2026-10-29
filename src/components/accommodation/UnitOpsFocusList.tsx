import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type { AccommodationStatus, UUID, UnitListItemResponse } from '../../api/types';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { EmptyState } from '../ui';
import { AccommodationStatusBadge } from './AccommodationStatusBadge';

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
      {visible.map(unit => (
        <Pressable
          key={unit.unitId}
          style={styles.row}
          onPress={() => {
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
          }}>
          <View style={styles.copy}>
            <Text style={styles.name}>{unit.name}</Text>
            <Text style={styles.building}>{unit.buildingName}</Text>
          </View>
          <AccommodationStatusBadge status={unit.status} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  building: {
    ...typography.caption,
    color: colors.muted,
  },
});
