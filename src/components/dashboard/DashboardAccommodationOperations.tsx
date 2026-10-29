import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bed, Building2, IndianRupee, UserPlus, Users } from 'lucide-react-native';
import type { DashboardAccommodationOperations } from '../../api/types';
import { pastels, spacing } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';
import { DashboardStatCard } from './shared/DashboardStatCard';

export type AccommodationOpsMetricId = 'occupied' | 'vacant' | 'moveIns' | 'pendingPay';

type DashboardAccommodationOperationsProps = {
  operations: DashboardAccommodationOperations;
  hideTitle?: boolean;
  /** Unit-only spaces (rental, corporate stay) count units, not beds. */
  occupancyEntity?: 'beds' | 'units';
  onOccupiedPress?: () => void;
  onVacantPress?: () => void;
  onMoveInsPress?: () => void;
  /** When set, shows Pending payments card (Rooms home parity with Web). */
  onPendingPress?: () => void;
  /** Highlights the active Rooms ops filter card. */
  selectedMetricId?: AccommodationOpsMetricId | null;
};

export function DashboardAccommodationOperations({
  operations,
  hideTitle = false,
  onOccupiedPress,
  onVacantPress,
  onMoveInsPress,
  onPendingPress,
  selectedMetricId = null,
  occupancyEntity = 'beds',
}: DashboardAccommodationOperationsProps) {
  const { t } = useTranslation();
  const showPending = typeof onPendingPress === 'function';
  const unitLevel = occupancyEntity === 'units';
  const occupiedLabel = unitLevel
    ? t('dashboard.accommodationOperations.occupiedUnits', { defaultValue: 'Occupied units' })
    : t('dashboard.accommodationOperations.occupiedBeds');
  const vacantLabel = unitLevel
    ? t('dashboard.accommodationOperations.availableUnits', { defaultValue: 'Available units' })
    : t('dashboard.accommodationOperations.vacantBeds');
  const VacantIcon = unitLevel ? Building2 : Bed;

  return (
    <View style={styles.wrap}>
      {hideTitle ? null : (
        <DashboardSectionTitle title={t('dashboard.accommodationOperations.title')} />
      )}
      <View style={[styles.row, showPending && styles.rowWrap]}>
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
          gridItem={showPending}
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
          gridItem={showPending}
        />
        <DashboardStatCard
          icon={UserPlus}
          accent={pastels.blue.fg}
          surface={pastels.blue.bg}
          surfaceBorder={pastels.blue.border}
          value={String(operations.moveInsThisMonth)}
          label={t('dashboard.accommodationOperations.moveInsThisMonth')}
          onPress={onMoveInsPress}
          selected={selectedMetricId === 'moveIns'}
          selectionColor={pastels.blue.fg}
          gridItem={showPending}
        />
        {showPending ? (
          <DashboardStatCard
            icon={IndianRupee}
            accent={pastels.orange.fg}
            surface={pastels.orange.bg}
            surfaceBorder={pastels.orange.border}
            value={String(operations.pendingPaymentsCount)}
            label={t('dashboard.accommodationOperations.pendingPayments')}
            onPress={onPendingPress}
            selected={selectedMetricId === 'pendingPay'}
            gridItem
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
});
