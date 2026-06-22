import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardAttentionItem, UUID } from '../../api/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { navigateToPaymentsTab } from '../../navigation/navigationRef';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type DashboardAttentionCardProps = {
  spaceId: UUID;
  attention: DashboardAttentionItem;
};

function attentionIcon(kind: DashboardAttentionItem['kind']): string {
  switch (kind) {
    case 'not_planned':
    case 'partial_planned':
      return '⚠';
    case 'ready_to_share':
      return '📢';
    case 'poll_open':
      return '🟢';
    case 'payments_overdue':
      return '💳';
    case 'subscription_activation_pending':
      return '📋';
    default:
      return '⚠';
  }
}

export function DashboardAttentionCard({ spaceId, attention }: DashboardAttentionCardProps) {
  const { t } = useTranslation();
  const tomorrow = tomorrowIsoDate();

  const titleKey =
    attention.kind === 'partial_planned'
      ? (attention.missingMealTypes?.length ?? 0) === 1
        ? 'dashboard.attention.partial_planned.titleSingle'
        : 'dashboard.attention.partial_planned.titleMultiple'
      : attention.kind === 'subscription_activation_pending'
        ? (attention.pendingSubscriptionRequestCount ?? 0) === 1
          ? 'dashboard.attention.subscription_activation_pending.titleSingle'
          : 'dashboard.attention.subscription_activation_pending.titleMultiple'
        : `dashboard.attention.${attention.kind}.title`;

  const subtitleKey = `dashboard.attention.${attention.kind}.subtitle`;

  const titleParams =
    attention.kind === 'partial_planned' && (attention.missingMealTypes?.length ?? 0) === 1
      ? {
          meal: t(mealTypeLabelKey(attention.missingMealTypes![0])),
        }
      : attention.kind === 'payments_overdue'
        ? {
            count: attention.overdueCount ?? 0,
          }
        : attention.kind === 'subscription_activation_pending'
          ? {
              count: attention.pendingSubscriptionRequestCount ?? 0,
            }
          : undefined;

  const subtitleParams = {
    scheduled: attention.scheduledCount,
    total: attention.totalMeals,
    responded: attention.respondedCount,
    eligible: attention.eligibleCount,
    count: attention.overdueCount,
    amount:
      formatComboPrice(attention.overdueAmount ?? null, attention.currencyCode ?? 'INR') ?? '—',
    pendingRequests: attention.pendingSubscriptionRequestCount,
  };

  const onPress = useCallback(() => {
    switch (attention.kind) {
      case 'not_planned':
      case 'partial_planned':
        navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrow });
        return;
      case 'ready_to_share':
        navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow });
        return;
      case 'poll_open':
        navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrow });
        return;
      case 'payments_overdue':
        navigateToPaymentsTab(spaceId);
        return;
      case 'subscription_activation_pending':
        navigateMainStack('SubscriptionActivationRequests', { spaceId });
        return;
      default:
        return;
    }
  }, [attention.kind, spaceId, tomorrow]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        attention.kind === 'subscription_activation_pending' && styles.cardSubscription,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button">
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{attentionIcon(attention.kind)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {t(titleKey, titleParams)}
          </Text>
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>
          {t(subtitleKey, subtitleParams)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

type DashboardAttentionCardsRowProps = {
  spaceId: UUID;
  items: DashboardAttentionItem[];
};

export function DashboardPendingActionsList({ spaceId, items }: DashboardAttentionCardsRowProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {items.map((attention, index) => (
        <DashboardAttentionCard
          key={`${attention.kind}-${index}`}
          spaceId={spaceId}
          attention={attention}
        />
      ))}
    </View>
  );
}

/** @deprecated Use DashboardPendingActionsList */
export function DashboardAttentionCardsRow(props: DashboardAttentionCardsRowProps) {
  return <DashboardPendingActionsList {...props} />;
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  cardSubscription: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  icon: {
    fontSize: 16,
    lineHeight: 20,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: 22,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.muted,
    paddingLeft: spacing.xxs,
  },
});
