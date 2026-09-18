import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bed, IndianRupee, UserPlus, Users } from 'lucide-react-native';
import type { DashboardAccommodationOperations } from '../../api/types';
import { pastels, spacing } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';
import { DashboardStatCard } from './shared/DashboardStatCard';

export type AccommodationOpsMetricId = 'occupied' | 'vacant' | 'moveIns' | 'pendingPay';

type DashboardAccommodationOperationsProps = {
  operations: DashboardAccommodationOperations;
  hideTitle?: boolean;
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
}: DashboardAccommodationOperationsProps) {
  const { t } = useTranslation();
  const showPending = typeof onPendingPress === 'function';

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
          label={t('dashboard.accommodationOperations.occupiedBeds')}
          onPress={onOccupiedPress}
          selected={selectedMetricId === 'occupied'}
          gridItem={showPending}
        />
        <DashboardStatCard
          icon={Bed}
          accent={pastels.purple.fg}
          surface={pastels.purple.bg}
          surfaceBorder={pastels.purple.border}
          value={String(operations.vacantBeds)}
          label={t('dashboard.accommodationOperations.vacantBeds')}
          onPress={onVacantPress}
          selected={selectedMetricId === 'vacant'}
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
