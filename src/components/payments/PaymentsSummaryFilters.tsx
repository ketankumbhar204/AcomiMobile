import React, { memo, useMemo, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
} from 'lucide-react-native';
import type { DashboardFinancialSummary } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import type { PaymentLedgerFilter } from '../../utils/paymentLedger';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Mock palette — pastel fill + matching accent (icons/labels). */
const CARD_THEME = {
  expected: {
    accent: '#16A34A',
    background: '#ECFDF5',
    iconBg: '#D1FAE5',
    border: '#A7F3D0',
  },
  collected: {
    accent: '#2563EB',
    background: '#EFF6FF',
    iconBg: '#DBEAFE',
    border: '#BFDBFE',
  },
  underReview: {
    accent: '#7C3AED',
    background: '#F5F3FF',
    iconBg: '#EDE9FE',
    border: '#DDD6FE',
  },
  pending: {
    accent: '#EA580C',
    background: '#FFF7ED',
    iconBg: '#FFEDD5',
    border: '#FED7AA',
  },
} as const;

type CardTheme = (typeof CARD_THEME)[keyof typeof CARD_THEME];

type FilterDef = {
  id: PaymentLedgerFilter;
  labelKey: string;
  icon: ComponentType<IconProps>;
  theme: CardTheme;
  amount: number | null | undefined;
};

type PaymentsSummaryFiltersProps = {
  loading: boolean;
  financial: DashboardFinancialSummary | null;
  activeFilter: PaymentLedgerFilter;
  onFilterPress: (filter: PaymentLedgerFilter) => void;
};

type SummaryCardProps = {
  label: string;
  value: string;
  icon: ComponentType<IconProps>;
  theme: CardTheme;
  selected: boolean;
  onPress: () => void;
};

/**
 * Mock layout — one horizontal row:
 * [icon] | label + amount (stacked) | >
 */
const SummaryCard = memo(function SummaryCard({
  label,
  value,
  icon: Icon,
  theme,
  selected,
  onPress,
}: SummaryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.background,
          borderColor: selected ? theme.accent : theme.border,
        },
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
        <Icon size={16} color={theme.accent} strokeWidth={2.2} />
      </View>
      <View style={styles.textStack}>
        <Text style={[styles.label, { color: theme.accent }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <ChevronRight size={16} color="#9CA3AF" strokeWidth={2.2} />
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
        icon: FileText,
        theme: CARD_THEME.expected,
        amount: financial?.expectedCharges,
      },
      {
        id: 'collected',
        labelKey: 'dashboard.financial.collected',
        icon: CreditCard,
        theme: CARD_THEME.collected,
        amount: financial?.collected,
      },
      {
        id: 'underReview',
        labelKey: 'dashboard.financial.underReview',
        icon: Clock,
        theme: CARD_THEME.underReview,
        amount: financial?.underReview,
      },
      {
        id: 'pending',
        labelKey: 'dashboard.financial.pending',
        icon: AlertTriangle,
        theme: CARD_THEME.pending,
        amount: financial?.pending,
      },
    ],
    [financial?.collected, financial?.expectedCharges, financial?.pending, financial?.underReview],
  );

  return (
    <View style={styles.wrap}>
      {loading && !financial ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.grid}>
          {filters.map(filter => (
            <SummaryCard
              key={filter.id}
              label={t(filter.labelKey)}
              value={formatComboPrice(filter.amount ?? null, currencyCode) ?? '—'}
              icon={filter.icon}
              theme={filter.theme}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  cardSelected: {
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  value: {
    ...typography.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});
