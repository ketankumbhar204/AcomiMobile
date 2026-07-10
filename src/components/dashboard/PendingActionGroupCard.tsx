import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PendingActionGroup, UUID } from '../../api/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { navigateToPaymentsTab } from '../../navigation/navigationRef';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { isOwnerOnlyNotificationType } from '../../utils/ownerOnlyNotifications';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';

type PendingActionGroupCardProps = {
  spaceId: UUID;
  group: PendingActionGroup;
};

function actionIcon(actionType: PendingActionGroup['actionType']): string {
  switch (actionType) {
    case 'PAYMENT_NEEDS_REVIEW':
    case 'PAYMENT_NEEDS_UPDATE':
    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_UPDATE_REQUESTED':
      return '💳';
    case 'MENU_NOT_PLANNED':
    case 'MENU_DRAFT_PENDING_PUBLISH':
    case 'MEAL_POLL_NOT_PUBLISHED':
    case 'MEAL_RESPONSES_BELOW_THRESHOLD':
      return '🍽';
    case 'SUBSCRIPTION_ACTIVATION_PENDING':
      return '📋';
    case 'MOVE_IN_SCHEDULED_TODAY':
    case 'MOVE_OUT_SCHEDULED_TODAY':
    case 'RESERVATION_STARTING_TODAY':
      return '🏠';
    case 'COMPLAINT_PENDING':
    case 'COMPLAINT_OVERDUE':
      return '⚠';
    case 'PENDING_INVITATION':
      return '✉️';
    default:
      return '🔔';
  }
}

function navigateForAction(spaceId: UUID, group: PendingActionGroup, canManageMeals: boolean) {
  if (!canManageMeals && isOwnerOnlyNotificationType(group.actionType)) {
    return;
  }
  const tomorrow = tomorrowIsoDate();
  switch (group.actionType) {
    case 'PAYMENT_NEEDS_REVIEW':
      navigateToPaymentsTab(spaceId, { initialSection: 'submitted' });
      return;
    case 'PAYMENT_NEEDS_UPDATE':
      navigateToPaymentsTab(spaceId, { initialSection: 'changesRequested' });
      return;
    case 'PAYMENT_UPDATE_REQUESTED': {
      const paymentId = group.items[0]?.entityId;
      if (paymentId) {
        navigateMainStack('PaymentDetail', { spaceId, paymentId });
      } else {
        navigateToPaymentsTab(spaceId);
      }
      return;
    }
    case 'PAYMENT_OVERDUE':
      navigateToPaymentsTab(spaceId, { initialSection: 'members' });
      return;
    case 'MENU_NOT_PLANNED':
    case 'MEAL_RESPONSES_BELOW_THRESHOLD':
      navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrow });
      return;
    case 'MENU_DRAFT_PENDING_PUBLISH':
      navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow });
      return;
    case 'SUBSCRIPTION_ACTIVATION_PENDING':
      navigateMainStack('SubscriptionActivationRequests', { spaceId });
      return;
    case 'COMPLAINT_PENDING':
    case 'COMPLAINT_OVERDUE': {
      const complaintId = group.items[0]?.entityId;
      if (complaintId) {
        navigateMainStack('ComplaintDetail', { spaceId, complaintId });
      }
      return;
    }
    default:
      if (canManageMeals && group.actionRoute === 'MenuPlanning') {
        navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrow });
      } else if (canManageMeals && group.actionRoute === 'MenuSharePreview') {
        navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow });
      } else if (canManageMeals && group.actionRoute === 'SubscriptionActivationRequests') {
        navigateMainStack('SubscriptionActivationRequests', { spaceId });
      } else if (group.actionRoute === 'ComplaintDetail') {
        const complaintId = group.items[0]?.entityId;
        if (complaintId) {
          navigateMainStack('ComplaintDetail', { spaceId, complaintId });
        }
      }
  }
}

export function PendingActionGroupCard({ spaceId, group }: PendingActionGroupCardProps) {
  const { t } = useTranslation();
  const permissions = useSpacePermissions(spaceId);
  const canManageMeals = permissions.canManageMeals === true;
  const title =
    t(`dashboard.pendingActions.groups.${group.actionType}`, {
      defaultValue: group.title,
    }) + (group.count > 0 ? ` (${group.count})` : '');

  const subtitle =
    group.items[0]?.message ??
    group.actionLabel ??
    t('dashboard.pendingActions.tapToOpen');

  const onPress = useCallback(() => {
    navigateForAction(spaceId, group, canManageMeals);
  }, [canManageMeals, group, spaceId]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button">
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{actionIcon(group.actionType)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

type PendingActionsListProps = {
  spaceId: UUID;
  groups: PendingActionGroup[];
};

export function PendingActionsList({ spaceId, groups }: PendingActionsListProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {groups.map(group => (
        <PendingActionGroupCard
          key={group.actionType}
          spaceId={spaceId}
          group={group}
        />
      ))}
    </View>
  );
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
