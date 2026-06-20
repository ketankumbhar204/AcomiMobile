import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardAccommodationOperations } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardAccommodationOperationsProps = {
  operations: DashboardAccommodationOperations;
};

function OperationCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function DashboardAccommodationOperations({
  operations,
}: DashboardAccommodationOperationsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={t('dashboard.accommodationOperations.title')} />
      <View style={styles.row}>
        <OperationCard
          value={String(operations.occupiedBeds)}
          label={t('dashboard.accommodationOperations.occupiedBeds')}
        />
        <OperationCard
          value={String(operations.vacantBeds)}
          label={t('dashboard.accommodationOperations.vacantBeds')}
        />
      </View>
      <View style={styles.row}>
        <OperationCard
          value={String(operations.moveInsThisMonth)}
          label={t('dashboard.accommodationOperations.moveInsThisMonth')}
        />
        <OperationCard
          value={String(operations.pendingPaymentsCount)}
          label={t('dashboard.accommodationOperations.pendingPayments')}
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
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 18,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
});
