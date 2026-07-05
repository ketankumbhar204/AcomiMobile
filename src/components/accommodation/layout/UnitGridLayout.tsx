import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { UnitListItemResponse } from '../../../api/types';
import { colors, spacing, typography } from '../../../theme';
import { matchesAccommodationSearch } from '../../../utils/accommodationLayoutSearch';
import { IllustratedUnitSlot } from './illustrated/IllustratedUnitSlot';

type UnitGridTileProps = {
  unit: UnitListItemResponse;
  searchQuery: string;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

/** @deprecated Use ApartmentFloorPlanLayout or BuildingUnitElevation */
export function UnitGridTile({
  unit,
  searchQuery,
  onPress,
  onLongPress,
  menu,
}: UnitGridTileProps) {
  const highlighted = matchesAccommodationSearch(unit.name, searchQuery);

  return (
    <View style={styles.cell}>
      <IllustratedUnitSlot
        label={unit.name}
        status={unit.status}
        ratioLabel={unit.bedCount > 0 ? `${unit.roomCount} r · ${unit.bedCount} b` : undefined}
        highlighted={highlighted}
        onPress={onPress}
        onLongPress={onLongPress}
        menu={menu}
      />
    </View>
  );
}

export function UnitGridHeader({ parentName }: { parentName?: string }) {
  if (!parentName) {
    return null;
  }
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{parentName}</Text>
    </View>
  );
}

export const UNIT_GRID_NUM_COLUMNS = 2;

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
