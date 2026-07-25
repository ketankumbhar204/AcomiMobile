import React, { memo, useMemo, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Inbox,
  IndianRupee,
  Wallet,
} from 'lucide-react-native';
import type { DashboardFinancialSummary } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import type { PaymentLedgerFilter } from '../../utils/paymentLedger';
import { DashboardSectionTitle } from '../dashboard/DashboardSectionTitle';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type FilterDef = {
  id: PaymentLedgerFilter;
  labelKey: string;
  icon: ComponentType<IconProps>;
  accent: string;
  amount: number | null | undefined;
};

type PaymentsSummaryFiltersProps = {
  loading: boolean;
  financial: DashboardFinancialSummary | null;
  activeFilter: PaymentLedgerFilter;
  onFilterPress: (filter: PaymentLedgerFilter) => void;
};

const ACCENT = {
  expected: colors.primaryDark,
  collected: colors.success,
  underReview: '#2563EB',
  pending: '#D97706',
} as const;

type CompactFilterCardProps = {
  label: string;
  value: string;
  icon: ComponentType<IconProps>;
  accent: string;
  selected: boolean;
  onPress: () => void;
};

/** Design A compact KPI filter — 4-across row. */
const CompactFilterCard = memo(function CompactFilterCard({
  label,
  value,
  icon: Icon,
  accent,
  selected,
  onPress,
}: CompactFilterCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        selected && { borderColor: accent, backgroundColor: `${accent}14` },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
        <Icon size={14} color={accent} strokeWidth={2.3} />
      </View>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, selected && { color: accent }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
});

export function PaymentsSummaryFilters({
  loading,
  financial,
  activeFilter,
  onFilterPress,
}: PaymentsSummaryFiltersProps) {
  const { t } = useTranslation();
  const currencyCode = financial?.currencyCode ?? 'INR';

  const filters = useMemo<FilterDef[]>(
    () => [
      {
        id: 'all',
        labelKey: 'dashboard.financial.expected',
        icon: Wallet,
        accent: ACCENT.expected,
        amount: financial?.expectedCharges,
      },
      {
        id: 'collected',
        labelKey: 'dashboard.financial.collected',
        icon: Inbox,
        accent: ACCENT.collected,
        amount: financial?.collected,
      },
      {
        id: 'underReview',
        labelKey: 'dashboard.financial.underReview',
        icon: Clock,
        accent: ACCENT.underReview,
        amount: financial?.underReview,
      },
      {
        id: 'pending',
        labelKey: 'dashboard.financial.pending',
        icon: IndianRupee,
        accent: ACCENT.pending,
        amount: financial?.pending,
      },
    ],
    [financial?.collected, financial?.expectedCharges, financial?.pending, financial?.underReview],
  );

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle
        title={t('dashboard.financial.title')}
        subtitle={t('dashboard.financial.period')}
      />
      {loading && !financial ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.row}>
          {filters.map(filter => (
            <CompactFilterCard
              key={filter.id}
              label={t(filter.labelKey)}
              value={formatComboPrice(filter.amount ?? null, currencyCode) ?? '—'}
              icon={filter.icon}
              accent={filter.accent}
              selected={activeFilter === filter.id}
              onPress={() => onFilterPress(filter.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xs,
  },
  loader: {
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  cardSelected: {
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    ...typography.bodyStrong,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    width: '100%',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    width: '100%',
  },
});
