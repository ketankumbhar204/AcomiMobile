import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardFinancialSummary } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardFinancialSnapshotProps = {
  loading: boolean;
  financial: DashboardFinancialSummary | null;
  title?: string;
  onExpectedPress?: () => void;
  onCollectedPress?: () => void;
  onPendingPress?: () => void;
};

function SnapshotCard({
  value,
  label,
  valueStyle,
  onPress,
}: {
  value: string;
  label: string;
  valueStyle?: object;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={[styles.value, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
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

export function DashboardFinancialSnapshot({
  loading,
  financial,
  title,
  onExpectedPress,
  onCollectedPress,
  onPendingPress,
}: DashboardFinancialSnapshotProps) {
  const { t } = useTranslation();
  const currencyCode = financial?.currencyCode ?? 'INR';

  const expected =
    formatComboPrice(financial?.expectedCharges ?? null, currencyCode) ?? '—';
  const collected = formatComboPrice(financial?.collected ?? null, currencyCode) ?? '—';
  const pending = formatComboPrice(financial?.pending ?? null, currencyCode) ?? '—';

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={title ?? t('dashboard.financial.title')} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.row}>
          <SnapshotCard
            value={expected}
            label={t('dashboard.financial.expectedCharges')}
            onPress={onExpectedPress}
          />
          <SnapshotCard
            value={collected}
            label={t('dashboard.financial.collected')}
            valueStyle={styles.collected}
            onPress={onCollectedPress}
          />
          <SnapshotCard
            value={pending}
            label={t('dashboard.financial.pending')}
            valueStyle={styles.pending}
            onPress={onPendingPress}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing.md,
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
  cardPressable: {},
  cardPressed: {
    opacity: 0.88,
    borderColor: colors.primary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 15,
  },
  collected: {
    color: colors.success,
  },
  pending: {
    color: '#EAB308',
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
});
