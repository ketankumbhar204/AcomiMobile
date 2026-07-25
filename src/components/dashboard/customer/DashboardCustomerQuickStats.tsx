import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
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

function StatCard({ stat, compact }: { stat: CustomerQuickStat; compact: boolean }) {
  const Icon = stat.icon;
  return (
    <View
      style={[styles.card, compact && styles.cardCompact]}
      accessibilityRole="summary"
      accessibilityLabel={`${stat.label}: ${stat.value}`}>
      <View style={[styles.iconWrap, { backgroundColor: `${stat.accent}18` }]}>
        <Icon size={16} color={stat.accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {stat.value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {stat.label}
      </Text>
    </View>
  );
}

export function DashboardCustomerQuickStats({
  totalMenuItems,
  yourOrders,
  dueAmount,
  currencyCode = 'INR',
  upcomingPayments,
  loading = false,
}: DashboardCustomerQuickStatsProps) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  const stats = useMemo<CustomerQuickStat[]>(
    () => [
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
      {
        id: 'due',
        label: t('dashboard.customer.stats.dueAmount'),
        value:
          loading || dueAmount == null || dueAmount <= 0
            ? '—'
            : formatMoney(dueAmount, currencyCode, i18n.language),
        icon: IndianRupee,
        accent: '#D97706',
      },
      {
        id: 'upcoming',
        label: t('dashboard.customer.stats.upcomingPayments'),
        value: loading ? '—' : String(upcomingPayments),
        icon: CalendarDays,
        accent: '#7C3AED',
      },
    ],
    [
      currencyCode,
      dueAmount,
      i18n.language,
      loading,
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
            <StatCard stat={stat} compact={compact} />
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 78,
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  cardCompact: {
    padding: spacing.sm,
    minHeight: 72,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.h3,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
});
