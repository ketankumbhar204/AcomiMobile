import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardAccommodationOperations } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardAccommodationOperationsProps = {
  operations: DashboardAccommodationOperations;
  onOccupiedPress?: () => void;
  onVacantPress?: () => void;
  onMoveInsPress?: () => void;
  onPendingPaymentsPress?: () => void;
};

function OperationCard({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, styles.cardPressable, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button">
      {content}
    </Pressable>
  );
}

export function DashboardAccommodationOperations({
  operations,
  onOccupiedPress,
  onVacantPress,
  onMoveInsPress,
  onPendingPaymentsPress,
}: DashboardAccommodationOperationsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={t('dashboard.accommodationOperations.title')} />
      <View style={styles.row}>
        <OperationCard
          value={String(operations.occupiedBeds)}
          label={t('dashboard.accommodationOperations.occupiedBeds')}
          onPress={onOccupiedPress}
        />
        <OperationCard
          value={String(operations.vacantBeds)}
          label={t('dashboard.accommodationOperations.vacantBeds')}
          onPress={onVacantPress}
        />
      </View>
      <View style={styles.row}>
        <OperationCard
          value={String(operations.moveInsThisMonth)}
          label={t('dashboard.accommodationOperations.moveInsThisMonth')}
          onPress={onMoveInsPress}
        />
        <OperationCard
          value={String(operations.pendingPaymentsCount)}
          label={t('dashboard.accommodationOperations.pendingPayments')}
          onPress={onPendingPaymentsPress}
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
    position: 'relative',
  },
  cardPressable: {},
  cardPressed: {
    opacity: 0.88,
    borderColor: colors.primary,
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
  chevron: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xxs,
    fontSize: 14,
    fontWeight: '300',
    color: colors.muted,
  },
});
