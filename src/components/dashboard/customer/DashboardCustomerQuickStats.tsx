import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import { DashboardSectionTitle } from '../DashboardSectionTitle';

export type CustomerQuickStat = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
};

type DashboardCustomerQuickStatsProps = {
  totalMenuItems: number;
  yourOrders: number;
  dueAmount: number | null;
  currencyCode?: string;
  upcomingPayments: number;
  loading?: boolean;
  /** Due amount and upcoming count are still loading. */
  paymentsLoading?: boolean;
  /** Payment records failed to load, so a zero would be a guess. */
  paymentsUnavailable?: boolean;
  onDuePress?: () => void;
  /** Menu-item and order counts are mess-only. */
  showMessStats?: boolean;
};

function formatMoney(amount: number, currencyCode: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount)}`;
  }
}

function StatCard({
  stat,
  compact,
  onPress,
}: {
  stat: CustomerQuickStat;
  compact: boolean;
  onPress?: () => void;
}) {
  const Icon = stat.icon;
  const body = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: `${stat.accent}18` }]}>
        <Icon size={18} color={stat.accent} strokeWidth={2.2} />
      </View>
      <View style={styles.divider} />
      <View style={styles.copy}>
        <Text style={[styles.value, { color: stat.accent }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {stat.value}
        </Text>
        <Text style={styles.label} numberOfLines={2}>
          {stat.label}
        </Text>
      </View>
      {onPress ? <ChevronRight size={16} color={colors.muted} strokeWidth={2.2} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View
        style={[styles.card, compact && styles.cardCompact]}
        accessibilityRole="summary"
        accessibilityLabel={`${stat.label}: ${stat.value}`}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${stat.label}: ${stat.value}`}>
      {body}
    </Pressable>
  );
}

export function DashboardCustomerQuickStats({
  totalMenuItems,
  yourOrders,
  dueAmount,
  currencyCode = 'INR',
  upcomingPayments,
  loading = false,
  paymentsLoading = false,
  paymentsUnavailable = false,
  onDuePress,
  showMessStats = true,
}: DashboardCustomerQuickStatsProps) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  const stats = useMemo<CustomerQuickStat[]>(() => {
    const shared: CustomerQuickStat[] = [
      {
        id: 'due',
        label: t('dashboard.customer.stats.dueAmount'),
        value: paymentsLoading
          ? '…'
          : paymentsUnavailable || dueAmount == null
            ? '—'
            : formatMoney(dueAmount, currencyCode, i18n.language),
        icon: IndianRupee,
        accent: '#D97706',
      },
      {
        id: 'upcoming',
        label: t('dashboard.customer.stats.upcomingPayments'),
        value: paymentsLoading ? '…' : paymentsUnavailable ? '—' : String(upcomingPayments),
        icon: CalendarDays,
        accent: '#7C3AED',
      },
    ];
    if (!showMessStats) {
      return shared;
    }
    return [
      {
        id: 'menuItems',
        label: t('dashboard.customer.stats.menuItems'),
        value: loading ? '—' : String(totalMenuItems),
        icon: UtensilsCrossed,
        accent: colors.primaryDark,
      },
      {
        id: 'orders',
        label: t('dashboard.customer.stats.yourOrders'),
        value: loading ? '—' : String(yourOrders),
        icon: ClipboardList,
        accent: '#2563EB',
      },
      ...shared,
    ];
  }, [
      currencyCode,
      dueAmount,
      i18n.language,
      loading,
      paymentsLoading,
      paymentsUnavailable,
      showMessStats,
      t,
      totalMenuItems,
      upcomingPayments,
      yourOrders,
    ],
  );

  return (
    <View style={styles.section}>
      <DashboardSectionTitle title={t('dashboard.customer.stats.title')} />
      <View style={styles.grid}>
        {stats.map(stat => (
          <View key={stat.id} style={styles.cell}>
            <StatCard
              stat={stat}
              compact={compact}
              onPress={stat.id === 'due' ? onDuePress : undefined}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  cell: {
    width: '50%',
    padding: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardCompact: {
    padding: spacing.sm,
    minHeight: 72,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
    backgroundColor: colors.border,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    ...typography.h3,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.muted,
  },
});
