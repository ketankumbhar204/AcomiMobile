import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bed, Building2, CalendarCheck2, Users } from 'lucide-react-native';
import type { DashboardAccommodationOperations } from '../../api/types';
import { pastels, spacing } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';
import { DashboardStatCard } from './shared/DashboardStatCard';

export type AccommodationOpsMetricId = 'occupied' | 'vacant' | 'reserved' | 'moveIns' | 'pendingPay';

type DashboardAccommodationOperationsProps = {
  operations: DashboardAccommodationOperations;
  hideTitle?: boolean;
  /** Unit-only spaces (rental, corporate stay) count units, not beds. */
  occupancyEntity?: 'beds' | 'units';
  onOccupiedPress?: () => void;
  onVacantPress?: () => void;
  onReservedPress?: () => void;
  /** @deprecated Prefer Recent Activity move-ins; kept for Rooms ops parity. */
  onMoveInsPress?: () => void;
  /** When set with showMoveIns, shows the legacy move-ins KPI. */
  showMoveIns?: boolean;
  /** Highlights the active Rooms ops filter card. */
  selectedMetricId?: AccommodationOpsMetricId | null;
  subtitle?: string;
};

/**
 * Property Operations filter KPI row: Occupied / Available / Reserved.
 * Click handlers are owned by the caller — this component never invents navigation.
 */
export function DashboardAccommodationOperations({
  operations,
  hideTitle = false,
  onOccupiedPress,
  onVacantPress,
  onReservedPress,
  onMoveInsPress,
  showMoveIns = false,
  selectedMetricId = null,
  occupancyEntity = 'beds',
  subtitle,
}: DashboardAccommodationOperationsProps) {
  const { t } = useTranslation();
  const unitLevel = occupancyEntity === 'units';
  // Filter cards use short labels to match the Rooms reference (Occupied / Available / Reserved).
  const occupiedLabel = t('dashboard.accommodationOperations.occupiedBedsShort', {
    defaultValue: 'Occupied',
  });
  const vacantLabel = t('dashboard.accommodationOperations.vacantBedsShort', {
    defaultValue: 'Available',
  });
  const reservedLabel = unitLevel
    ? t('dashboard.accommodationOperations.reservedUnits', {
        defaultValue: 'Reserved',
      })
    : t('dashboard.accommodationOperations.reservedBeds', {
        defaultValue: 'Reserved',
      });
  const VacantIcon = unitLevel ? Building2 : Bed;
  const reservedCount = operations.reservedBeds ?? 0;

  return (
    <View style={styles.wrap}>
      {hideTitle ? null : (
        <DashboardSectionTitle
          title={t('dashboard.accommodationOps.title', {
            defaultValue: 'Property Operations',
          })}
          subtitle={
            subtitle ??
            t('dashboard.accommodationOps.subtitleBeds', {
              defaultValue: 'Current bed status across all buildings',
            })
          }
        />
      )}
      <View style={[styles.row, showMoveIns && styles.rowWrap]}>
        <DashboardStatCard
          icon={Users}
          accent={pastels.mint.fg}
          surface={pastels.mint.bg}
          surfaceBorder={pastels.mint.border}
          value={String(operations.occupiedBeds)}
          label={occupiedLabel}
          onPress={onOccupiedPress}
          selected={selectedMetricId === 'occupied'}
          selectionColor={pastels.mint.fg}
          showChevron={false}
          gridItem={showMoveIns}
          style={styles.filterCard}
        />
        <DashboardStatCard
          icon={VacantIcon}
          accent={pastels.purple.fg}
          surface={pastels.purple.bg}
          surfaceBorder={pastels.purple.border}
          value={String(operations.vacantBeds)}
          label={vacantLabel}
          onPress={onVacantPress}
          selected={selectedMetricId === 'vacant'}
          selectionColor={pastels.purple.fg}
          showChevron={false}
          gridItem={showMoveIns}
          style={styles.filterCard}
        />
        <DashboardStatCard
          icon={CalendarCheck2}
          accent={pastels.orange.fg}
          surface={pastels.orange.bg}
          surfaceBorder={pastels.orange.border}
          value={String(reservedCount)}
          label={reservedLabel}
          onPress={onReservedPress}
          selected={selectedMetricId === 'reserved'}
          selectionColor={pastels.orange.fg}
          showChevron={false}
          gridItem={showMoveIns}
          style={styles.filterCard}
        />
        {showMoveIns ? (
          <DashboardStatCard
            icon={Users}
            accent={pastels.blue.fg}
            surface={pastels.blue.bg}
            surfaceBorder={pastels.blue.border}
            value={String(operations.moveInsThisMonth)}
            label={t('dashboard.accommodationOperations.moveInsThisMonth')}
            onPress={onMoveInsPress}
            selected={selectedMetricId === 'moveIns'}
            selectionColor={pastels.blue.fg}
            showChevron={false}
            gridItem
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
  filterCard: {
    minHeight: 88,
    paddingVertical: spacing.md,
  },
});
