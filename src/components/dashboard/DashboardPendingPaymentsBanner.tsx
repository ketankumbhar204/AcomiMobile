import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, IndianRupee } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type DashboardPendingPaymentsBannerProps = {
  count: number;
  onPress?: () => void;
};

/** Full-width pending-payment dues row under Property Operations. */
export const DashboardPendingPaymentsBanner = memo(
  function DashboardPendingPaymentsBanner({
    count,
    onPress,
  }: DashboardPendingPaymentsBannerProps) {
    const { t } = useTranslation();
    const title = t('dashboard.accommodationOperations.pendingPayments', {
      defaultValue: 'Pending payments',
    });
    const subtitle = t('dashboard.pendingPayments.subtitle', {
      defaultValue: 'Rent, deposit and other dues',
    });

    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && onPress ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${count}`}>
        <View style={styles.iconWrap}>
          <IndianRupee size={18} color="#DC2626" strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Text style={styles.count}>{count}</Text>
        {onPress ? (
          <ChevronRight size={18} color="#F87171" strokeWidth={2.4} />
        ) : null}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  count: {
    ...typography.h3,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: '#DC2626',
    minWidth: 28,
    textAlign: 'right',
  },
});
