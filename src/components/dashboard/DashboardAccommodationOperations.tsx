import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bed, UserPlus, Users } from 'lucide-react-native';
import type { DashboardAccommodationOperations } from '../../api/types';
import { pastels, spacing } from '../../theme';
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
          accent={pastels.mint.fg}
          surface={pastels.mint.bg}
          surfaceBorder={pastels.mint.border}
          value={String(operations.occupiedBeds)}
          label={t('dashboard.accommodationOperations.occupiedBeds')}
          onPress={onOccupiedPress}
        />
        <DashboardStatCard
          icon={Bed}
          accent={pastels.purple.fg}
          surface={pastels.purple.bg}
          surfaceBorder={pastels.purple.border}
          value={String(operations.vacantBeds)}
          label={t('dashboard.accommodationOperations.vacantBeds')}
          onPress={onVacantPress}
        />
        <DashboardStatCard
          icon={UserPlus}
          accent={pastels.blue.fg}
          surface={pastels.blue.bg}
          surfaceBorder={pastels.blue.border}
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
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
