import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomerSubscriptionStatusResponse } from '../../api/types';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { formatSubscriptionDate } from '../../utils/subscriptionLifecycle';

type DashboardCustomerSubscriptionBannerProps = {
  status: CustomerSubscriptionStatusResponse;
  locale: string;
  onViewPlans: () => void;
  onContactOwner?: () => void;
};

export function DashboardCustomerSubscriptionBanner({
  status,
  locale,
  onViewPlans,
  onContactOwner,
}: DashboardCustomerSubscriptionBannerProps) {
  const { t } = useTranslation();

  if (!status.prepaidBilling) {
    return null;
  }

  if (status.pendingActivationStatus === 'PENDING') {
    return (
      <View style={[styles.card, styles.pending]}>
        <Text style={styles.pendingBadge}>{t('meals.subscription.customer.pendingBadge')}</Text>
        <Text style={styles.title}>{t('meals.subscription.customer.pendingTitle')}</Text>
        <Text style={styles.body}>
          {t('meals.subscription.customer.pendingBody', {
            plan: status.pendingPlanName ?? t('meals.subscription.customer.selectedPlan'),
          })}
        </Text>
        <Button
          label={t('meals.subscription.customer.viewRequestStatus')}
          variant="secondary"
          onPress={onViewPlans}
          style={styles.action}
        />
      </View>
    );
  }

  if (status.subscriptionActive && status.lifecycleStatus === 'expiring_soon') {
    return (
      <View style={[styles.card, styles.warning]}>
        <Text style={styles.title}>{t('meals.subscription.customer.expiringSoonTitle')}</Text>
        <Text style={styles.body}>
          {t('meals.subscription.customer.expiringSoonBody', {
            remaining: status.mealsRemaining ?? '—',
            date: formatSubscriptionDate(status.validTill ?? null, locale),
          })}
        </Text>
        <Button
          label={t('meals.subscription.customer.viewPlans')}
          variant="secondary"
          onPress={onViewPlans}
          style={styles.action}
        />
      </View>
    );
  }

  if (status.subscriptionActive) {
    return null;
  }

  const isExpired = status.lifecycleStatus === 'expired' || status.lifecycleStatus === 'ended';

  return (
    <View style={[styles.card, isExpired ? styles.warning : styles.required]}>
      <Text style={styles.title}>
        {isExpired
          ? t('meals.subscription.customer.expiredTitle')
          : t('meals.subscription.customer.requiredTitle')}
      </Text>
      <Text style={styles.body}>
        {isExpired
          ? t('meals.subscription.customer.expiredBody', {
              date: formatSubscriptionDate(status.validTill ?? status.endedAt ?? null, locale),
            })
          : t('meals.subscription.customer.requiredBody')}
      </Text>
      <View style={styles.actions}>
        <Button
          label={t('meals.subscription.customer.viewPlans')}
          onPress={onViewPlans}
          style={styles.actionButton}
        />
        {onContactOwner ? (
          <Pressable onPress={onContactOwner} style={styles.linkWrap}>
            <Text style={styles.link}>{t('meals.subscription.customer.contactOwner')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  required: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  warning: {
    borderColor: '#F59E0B',
    backgroundColor: colors.warningTint,
  },
  pending: {
    borderColor: '#F59E0B',
    backgroundColor: colors.warningTint,
  },
  pendingBadge: {
    ...typography.caption,
    color: '#B45309',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  action: {
    marginTop: spacing.md,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  linkWrap: {
    paddingVertical: spacing.xs,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
