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
import { colors, radius, spacing, typography } from '../../theme';
import { navigateFromNotificationType } from '../../utils/notificationDeepLinks';
import { canManageNotifications } from '../../utils/spaceOperator';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SpaceNotifications'>;
type Route = NativeStackScreenProps<MainStackParamList, 'SpaceNotifications'>['route'];

export function SpaceNotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);
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
      navigateFromNotificationType(spaceId, notification, isOperator);
    },
    [isOperator, markRead, spaceId],
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
              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {notification.title}
                </Text>
                {notification.message ? (
                  <Text style={styles.message} numberOfLines={2}>
                    {notification.message}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: spacing.sm },
  loader: { marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUnread: {
    borderColor: colors.primary,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  message: {
    ...typography.caption,
    color: colors.muted,
  },
  chevron: {
    fontSize: 20,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
});
