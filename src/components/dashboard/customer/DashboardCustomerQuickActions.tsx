import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CircleAlert, ClipboardList, Wallet, type LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import { DashboardSectionTitle } from '../DashboardSectionTitle';

type ActionId = 'orders' | 'payments' | 'complaints';

type DashboardCustomerQuickActionsProps = {
  onOrders: () => void;
  onPayments: () => void;
  onComplaints: () => void;
};

const ACTIONS: {
  id: ActionId;
  labelKey: string;
  icon: LucideIcon;
  accent: string;
}[] = [
  {
    id: 'orders',
    labelKey: 'dashboard.customer.quickActions.myOrders',
    icon: ClipboardList,
    accent: colors.primaryDark,
  },
  {
    id: 'payments',
    labelKey: 'dashboard.customer.quickActions.payments',
    icon: Wallet,
    accent: '#D97706',
  },
  {
    id: 'complaints',
    labelKey: 'dashboard.customer.quickActions.complaints',
    icon: CircleAlert,
    accent: '#DC2626',
  },
];

export const DashboardCustomerQuickActions = memo(function DashboardCustomerQuickActions({
  onOrders,
  onPayments,
  onComplaints,
}: DashboardCustomerQuickActionsProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const handlers: Record<ActionId, () => void> = {
    orders: onOrders,
    payments: onPayments,
    complaints: onComplaints,
  };

  return (
    <View style={styles.section}>
      <DashboardSectionTitle title={t('dashboard.customer.quickActions.title')} />
      <View style={[styles.row, width < 340 && styles.rowWrap]}>
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.id}
              onPress={handlers[action.id]}
              style={({ pressed }) => [
                styles.card,
                width < 340 && styles.cardWrap,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t(action.labelKey)}>
              <View style={[styles.iconWrap, { backgroundColor: `${action.accent}18` }]}>
                <Icon size={22} color={action.accent} strokeWidth={2.2} />
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {t(action.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    minWidth: 96,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    ...shadows.sm,
  },
  cardWrap: {
    flexBasis: '30%',
    flexGrow: 1,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
