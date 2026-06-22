import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPlanResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type SubscriptionPlanCardProps = {
  plan: SubscriptionPlanResponse;
  onPress?: () => void;
  onEdit?: () => void;
  selectable?: boolean;
  selected?: boolean;
  showStatus?: boolean;
};

export function SubscriptionPlanCard({
  plan,
  onPress,
  onEdit,
  selectable = false,
  selected = false,
  showStatus = false,
}: SubscriptionPlanCardProps) {
  const { t } = useTranslation();
  const priceLabel = formatComboPrice(plan.price, plan.currencyCode) ?? '—';
  const unusedPolicy = plan.carryForwardUnused
    ? t('meals.subscriptionPlans.carryForward')
    : t('meals.subscriptionPlans.expireUnused');

  const content = (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={2}>
          {plan.name}
        </Text>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>
      <Text style={styles.meta}>
        {t('meals.subscriptionPlans.mealsLine', { count: plan.mealsIncluded })}
        {' · '}
        {t('meals.subscriptionPlans.validityLine', { days: plan.validityDays })}
      </Text>
      <Text style={styles.policy}>{unusedPolicy}</Text>
      {plan.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {plan.description}
        </Text>
      ) : null}
      {showStatus ? (
        <Text style={[styles.status, !plan.isActive && styles.statusInactive]}>
          {plan.isActive
            ? t('meals.subscriptionPlans.statusActive')
            : t('meals.subscriptionPlans.statusInactive')}
        </Text>
      ) : null}
      {onEdit ? (
        <Pressable onPress={onEdit} style={styles.editLink} accessibilityRole="button">
          <Text style={styles.editLinkText}>{t('common.edit')}</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={selectable ? 'radio' : 'button'}
      accessibilityState={{ selected: selectable ? selected : undefined }}
      style={({ pressed }) => [
        styles.card,
        selectable && selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}>
      {selectable ? (
        <View style={styles.selectRow}>
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.selectContent}>{content}</View>
        </View>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#ECFDF5',
  },
  cardPressed: {
    opacity: 0.92,
  },
  selectRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  selectContent: {
    flex: 1,
    minWidth: 0,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  price: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    flexShrink: 0,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  policy: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  status: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  statusInactive: {
    color: colors.muted,
  },
  editLink: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  editLinkText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
