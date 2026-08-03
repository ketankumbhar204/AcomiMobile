import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Package, SquarePen, UtensilsCrossed } from 'lucide-react-native';
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
        <View style={styles.iconWell}>
          <Package size={18} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {plan.name}
          </Text>
          <Text style={styles.price}>{priceLabel}</Text>
        </View>
        {selectable && selected ? (
          <View style={styles.selectedBadge}>
            <Check size={14} color={colors.white} strokeWidth={2.8} />
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <UtensilsCrossed size={12} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.metaChipText}>
            {t('meals.subscriptionPlans.mealsLine', { count: plan.mealsIncluded })}
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>
            {t('meals.subscriptionPlans.validityLine', { days: plan.validityDays })}
          </Text>
        </View>
      </View>

      <Text style={styles.policy}>{unusedPolicy}</Text>
      {plan.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {plan.description}
        </Text>
      ) : null}

      {showStatus ? (
        <View
          style={[
            styles.statusChip,
            plan.isActive ? styles.statusActive : styles.statusInactive,
          ]}>
          <Text
            style={[
              styles.statusText,
              plan.isActive ? styles.statusTextActive : styles.statusTextInactive,
            ]}>
            {plan.isActive
              ? t('meals.subscriptionPlans.statusActive')
              : t('meals.subscriptionPlans.statusInactive')}
          </Text>
        </View>
      ) : null}

      {onEdit ? (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.editLink, pressed && styles.editPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}>
          <SquarePen size={14} color={colors.primaryDark} strokeWidth={2.2} />
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
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.successTint,
  },
  cardPressed: {
    opacity: 0.92,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  price: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  policy: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusActive: {
    backgroundColor: colors.successTint,
    borderColor: '#A7F3D0',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: colors.border,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: colors.muted,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  editPressed: {
    opacity: 0.75,
  },
  editLinkText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.primaryDark,
  },
});
