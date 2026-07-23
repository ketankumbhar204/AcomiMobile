import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Receipt } from 'lucide-react-native';
import { PaymentStatusBadge } from '../../payments/PaymentStatusBadge';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import { formatMenuDate } from '../../../utils/mealDates';
import type { CustomerRecentOrderRow } from '../../../utils/customerDashboardStats';
import { DashboardSectionTitle } from '../DashboardSectionTitle';

type DashboardCustomerRecentOrdersProps = {
  orders: CustomerRecentOrderRow[];
  loading?: boolean;
  onPressOrder?: (date: string) => void;
  onViewAll?: () => void;
};

function formatAmount(amount: number | null, currencyCode: string, locale: string): string {
  if (amount == null) {
    return '—';
  }
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

function OrderCard({
  order,
  onPress,
}: {
  order: CustomerRecentOrderRow;
  onPress?: (date: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const dateLabel = formatMenuDate(order.date, i18n.language);

  return (
    <Pressable
      onPress={onPress ? () => onPress(order.date) : undefined}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${dateLabel}, ${order.itemCount} items, ${formatAmount(
        order.amount,
        order.currencyCode,
        i18n.language,
      )}`}>
      <View style={styles.iconWrap}>
        <Receipt size={18} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.date} numberOfLines={1}>
          {dateLabel}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {t('dashboard.customer.recentOrders.itemCount', { count: order.itemCount })}
        </Text>
      </View>
      <View style={styles.trailing}>
        <Text style={styles.amount} numberOfLines={1}>
          {formatAmount(order.amount, order.currencyCode, i18n.language)}
        </Text>
        {order.paymentStatus ? (
          <PaymentStatusBadge status={order.paymentStatus as never} />
        ) : null}
      </View>
    </Pressable>
  );
}

export const DashboardCustomerRecentOrders = memo(function DashboardCustomerRecentOrders({
  orders,
  loading = false,
  onPressOrder,
  onViewAll,
}: DashboardCustomerRecentOrdersProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <View style={styles.titleFlex}>
          <DashboardSectionTitle title={t('dashboard.customer.recentOrders.title')} />
        </View>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8} accessibilityRole="button">
            <Text style={styles.viewAll}>{t('dashboard.customer.recentOrders.viewAll')}</Text>
          </Pressable>
        ) : null}
      </View>

      {loading && orders.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('dashboard.customer.recentOrders.empty')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {orders.map(order => (
            <OrderCard key={order.date} order={order} onPress={onPressOrder} />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleFlex: {
    flex: 1,
  },
  viewAll: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  date: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    maxWidth: '42%',
  },
  amount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  empty: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  loader: {
    marginVertical: spacing.md,
  },
});
