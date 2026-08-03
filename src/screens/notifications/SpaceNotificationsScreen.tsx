import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight } from 'lucide-react-native';
import type { SpaceNotification } from '../../api/types';
import {
  EmptyState,
  HeaderBackButton,
  ListSearchBar,
  Screen,
  Skeleton,
  ListFilterChips,
} from '../../components/ui';
import type { ListFilterChipOption } from '../../components/ui/ListFilterChips';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { useSpaceNotifications } from '../../hooks/useSpaceNotifications';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { navigateFromNotificationType } from '../../utils/notificationDeepLinks';
import { canManageNotifications } from '../../utils/spaceOperator';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import {
  getNotificationCategoryColor,
  getNotificationIcon,
  notificationMatchesFilter,
  type NotificationFilterId,
} from '../../utils/spaceVisuals';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SpaceNotifications'>;
type Route = NativeStackScreenProps<MainStackParamList, 'SpaceNotifications'>['route'];

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  if (day === today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString();
}

type NotificationBucket = 'today' | 'yesterday' | 'earlier';

function bucketFor(value: string): NotificationBucket {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'earlier';
  }
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const oneDay = 24 * 60 * 60 * 1000;
  if (day === today) {
    return 'today';
  }
  if (day === today - oneDay) {
    return 'yesterday';
  }
  return 'earlier';
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: SpaceNotification;
  onPress: () => void;
}) {
  const isUnread = notification.status === 'UNREAD';
  const accent = getNotificationCategoryColor(notification.category);
  const Icon = getNotificationIcon(notification.notificationType, notification.category);
  const time = formatTime(notification.createdAt);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isUnread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={notification.title}>
      <View style={[styles.cardIcon, { backgroundColor: `${accent}14` }]}>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={2}>
            {notification.title}
          </Text>
          {isUnread ? <View style={[styles.unreadDot, { backgroundColor: accent }]} /> : null}
        </View>
        {notification.message ? (
          <Text style={styles.cardMessage} numberOfLines={2}>
            {notification.message}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          {time ? <Text style={styles.cardTime}>{time}</Text> : null}
          {notification.actionLabel ? (
            <View style={styles.actionPill}>
              <Text style={[styles.actionPillText, { color: accent }]} numberOfLines={1}>
                {notification.actionLabel}
              </Text>
              <ChevronRight size={12} color={accent} strokeWidth={2.6} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function SpaceNotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);
  const { notifications, unreadCount, loading, markRead } = useSpaceNotifications(
    spaceId,
    true,
  );

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NotificationFilterId>('all');

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

  const filterOptions = useMemo<ListFilterChipOption<NotificationFilterId>[]>(
    () => [
      { id: 'all', label: t('list.filters.all') },
      {
        id: 'unread',
        label: t('notifications.filters.unread', { defaultValue: 'Unread' }),
        badge: unreadCount > 0 ? unreadCount : undefined,
        tone: 'primary',
      },
      {
        id: 'action',
        label: t('notifications.filters.action', { defaultValue: 'Action needed' }),
        tone: 'warning',
      },
      { id: 'billing', label: t('notifications.filters.billing', { defaultValue: 'Billing' }) },
      { id: 'meals', label: t('notifications.filters.meals', { defaultValue: 'Meals' }) },
      { id: 'general', label: t('notifications.filters.general', { defaultValue: 'General' }) },
    ],
    [t, unreadCount],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter(n => {
      const matchesFilter = notificationMatchesFilter(
        filter,
        n.notificationType,
        n.category,
        n.status === 'UNREAD',
      );
      if (!matchesFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        n.title.toLowerCase().includes(query) ||
        (n.message?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [filter, notifications, search]);

  const groups = useMemo(() => {
    const buckets: Record<NotificationBucket, SpaceNotification[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    for (const n of filtered) {
      buckets[bucketFor(n.createdAt)].push(n);
    }
    return [
      { id: 'today' as const, label: t('notifications.groups.today', { defaultValue: 'Today' }), items: buckets.today },
      { id: 'yesterday' as const, label: t('notifications.groups.yesterday', { defaultValue: 'Yesterday' }), items: buckets.yesterday },
      { id: 'earlier' as const, label: t('notifications.groups.earlier', { defaultValue: 'Earlier' }), items: buckets.earlier },
    ].filter(group => group.items.length > 0);
  }, [filtered, t]);

  const isInitialLoading = loading && notifications.length === 0;
  const hasNotifications = notifications.length > 0;

  return (
    <Screen scrollable={false} contentStyle={styles.flexContent}>
      <View style={styles.header}>
        <MealFormHero
          icon={Bell}
          eyebrow={t('notifications.eyebrow', { defaultValue: 'Space' })}
          heading={t('notifications.title')}
          subheading={
            unreadCount > 0
              ? t('notifications.unreadSummary', {
                  count: unreadCount,
                  defaultValue: '{{count}} unread updates',
                })
              : t('notifications.allCaughtUp', { defaultValue: "You're all caught up." })
          }
          compact
        />

        {hasNotifications ? (
          <>
            <ListSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('notifications.searchPlaceholder', {
                defaultValue: 'Search notifications',
              })}
            />
            <ListFilterChips
              options={filterOptions}
              value={filter}
              onChange={setFilter}
            />
          </>
        ) : null}
      </View>

      {isInitialLoading ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={44} height={44} borderRadius={radius.button} />
              <View style={styles.skeletonBody}>
                <Skeleton width={'80%'} height={14} />
                <Skeleton width={'55%'} height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : !hasNotifications ? (
        <EmptyState
          Icon={Bell}
          title={t('notifications.emptyTitle')}
          description={t('notifications.emptyDescription')}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          Icon={Bell}
          title={t('notifications.noMatchTitle', { defaultValue: 'No matching notifications' })}
          description={t('list.emptyFiltered')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {groups.map(group => (
            <View key={group.id} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map(notification => (
                <NotificationCard
                  key={notification.notificationId}
                  notification={notification}
                  onPress={() => void onPress(notification)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flexContent: {
    flex: 1,
    padding: 0,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  skeletonBody: {
    flex: 1,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardUnread: {
    borderColor: `${colors.primary}55`,
    backgroundColor: '#FBFEFC',
  },
  cardPressed: {
    opacity: 0.92,
    borderColor: `${colors.primary}66`,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyStrong,
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  cardMessage: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  cardTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPillText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
});
