import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { SpaceNotification } from '../../api/types';
import { EmptyState, HeaderBackButton, Screen } from '../../components/ui';
import { useSpaceNotifications } from '../../hooks/useSpaceNotifications';
import type { MainStackParamList } from '../../navigation/types';
import { navigateToPaymentsTab } from '../../navigation/navigationRef';
import { colors, radius, spacing, typography } from '../../theme';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { isOwnerOnlyNotificationType } from '../../utils/ownerOnlyNotifications';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SpaceNotifications'>;
type Route = NativeStackScreenProps<MainStackParamList, 'SpaceNotifications'>['route'];

function navigateFromNotification(
  spaceId: string,
  notification: SpaceNotification,
  navigation: Nav,
  canManageMeals: boolean,
) {
  const entityId = notification.entityId;
  if (!canManageMeals && isOwnerOnlyNotificationType(notification.notificationType)) {
    return;
  }
  switch (notification.notificationType) {
    case 'PAYMENT_UPDATE_REQUESTED':
    case 'PAYMENT_APPROVED':
    case 'PAYMENT_REJECTED':
    case 'PAYMENT_SUBMITTED':
      if (entityId) {
        navigation.navigate('PaymentDetail', { spaceId, paymentId: entityId });
      } else {
        navigateToPaymentsTab(spaceId);
      }
      return;
    case 'PAYMENT_NEEDS_REVIEW':
      navigateToPaymentsTab(spaceId, { initialSection: 'submitted' });
      return;
    case 'PAYMENT_NEEDS_UPDATE':
      navigateToPaymentsTab(spaceId, { initialSection: 'changesRequested' });
      return;
    case 'MENU_NOT_PLANNED':
    case 'MEAL_RESPONSES_BELOW_THRESHOLD':
      navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrowIsoDate() });
      return;
    case 'MENU_DRAFT_PENDING_PUBLISH':
      navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrowIsoDate() });
      return;
    case 'SUBSCRIPTION_ACTIVATION_PENDING':
      navigateMainStack('SubscriptionActivationRequests', { spaceId });
      return;
    case 'COMPLAINT_PENDING':
    case 'COMPLAINT_OVERDUE':
    case 'COMPLAINT_CREATED':
    case 'COMPLAINT_RESOLVED':
      if (entityId) {
        navigation.navigate('ComplaintDetail', { spaceId, complaintId: entityId });
      }
      return;
    default:
      if (notification.actionRoute === 'PaymentDetail' && entityId) {
        navigation.navigate('PaymentDetail', { spaceId, paymentId: entityId });
      } else if (notification.actionRoute === 'ComplaintDetail' && entityId) {
        navigation.navigate('ComplaintDetail', { spaceId, complaintId: entityId });
      }
  }
}

export function SpaceNotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  const canManageMeals = permissions.canManageMeals === true;
  const { notifications, loading, markRead } = useSpaceNotifications(spaceId, true);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: t('notifications.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  const onPress = useCallback(
    async (notification: SpaceNotification) => {
      if (notification.status === 'UNREAD') {
        try {
          await markRead(notification.notificationId);
        } catch {
          // Still navigate even if mark-read fails.
        }
      }
      navigateFromNotification(spaceId, notification, navigation, canManageMeals);
    },
    [canManageMeals, markRead, navigation, spaceId],
  );

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      {loading && notifications.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title={t('notifications.emptyTitle')}
          description={t('notifications.emptyDescription')}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {notifications.map(notification => (
            <Pressable
              key={notification.notificationId}
              style={({ pressed }) => [
                styles.card,
                notification.status === 'UNREAD' && styles.cardUnread,
                pressed && styles.cardPressed,
              ]}
              onPress={() => void onPress(notification)}>
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={2}>
                  {notification.title}
                </Text>
                {notification.status === 'UNREAD' ? <View style={styles.dot} /> : null}
              </View>
              {notification.message ? (
                <Text style={styles.message} numberOfLines={3}>
                  {notification.message}
                </Text>
              ) : null}
              {notification.actionLabel ? (
                <Text style={styles.action}>{notification.actionLabel}</Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUnread: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  cardPressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  message: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  action: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});
