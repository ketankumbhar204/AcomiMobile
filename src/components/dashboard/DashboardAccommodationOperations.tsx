import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bed, UserPlus, Users } from 'lucide-react-native';
import type { DashboardAccommodationOperations } from '../../api/types';
import { colors, spacing } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';
import { DashboardStatCard } from './shared/DashboardStatCard';

type DashboardAccommodationOperationsProps = {
  operations: DashboardAccommodationOperations;
  hideTitle?: boolean;
  onOccupiedPress?: () => void;
  onVacantPress?: () => void;
  onMoveInsPress?: () => void;
};

export function DashboardAccommodationOperations({
  operations,
  hideTitle = false,
  onOccupiedPress,
  onVacantPress,
  onMoveInsPress,
}: DashboardAccommodationOperationsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      {hideTitle ? null : (
        <DashboardSectionTitle title={t('dashboard.accommodationOperations.title')} />
      )}
      <View style={styles.row}>
        <DashboardStatCard
          icon={Users}
          accent={colors.primaryDark}
          value={String(operations.occupiedBeds)}
          label={t('dashboard.accommodationOperations.occupiedBeds')}
          onPress={onOccupiedPress}
        />
        <DashboardStatCard
          icon={Bed}
          accent="#6366F1"
          value={String(operations.vacantBeds)}
          label={t('dashboard.accommodationOperations.vacantBeds')}
          onPress={onVacantPress}
        />
        <DashboardStatCard
          icon={UserPlus}
          accent="#D97706"
          value={String(operations.moveInsThisMonth)}
          label={t('dashboard.accommodationOperations.moveInsThisMonth')}
          onPress={onMoveInsPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
