import React, { useLayoutEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Activity, Building2, ChevronRight } from 'lucide-react-native';
import type { GlobalActivityItem } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import {
  EmptyState,
  HeaderBackButton,
  Screen,
  Skeleton,
  SkeletonCard,
} from '../../components/ui';
import { useGlobalDashboard } from '../../hooks/useGlobalDashboard';
import type { MainStackParamList } from '../../navigation/types';
import { resetToDashboard } from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComplaintDateTime } from '../../utils/complaintStatus';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import {
  getNotificationCategoryColor,
  getNotificationIcon,
} from '../../utils/spaceVisuals';

type Nav = NativeStackNavigationProp<MainStackParamList, 'GlobalActivityList'>;

type ActivityBucket = 'today' | 'yesterday' | 'week' | 'earlier';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function bucketFor(value: string): ActivityBucket {
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
  if (day >= today - 7 * oneDay) {
    return 'week';
  }
  return 'earlier';
}

function ActivityCard({
  item,
  onPress,
  isLast,
}: {
  item: GlobalActivityItem;
  onPress: () => void;
  isLast: boolean;
}) {
  const accent = getNotificationCategoryColor(item.category);
  const Icon = getNotificationIcon(item.notificationType, item.category);
  const time = item.createdAt ? formatComplaintDateTime(item.createdAt) : '';

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: accent }]} />
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={item.title}>
        <View style={[styles.cardIcon, { backgroundColor: `${accent}14` }]}>
          <Icon size={18} color={accent} strokeWidth={2.2} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {item.spaceName ? (
              <View style={styles.spaceChip}>
                <Building2 size={11} color={colors.muted} strokeWidth={2.2} />
                <Text style={styles.spaceChipText} numberOfLines={1}>
                  {item.spaceName}
                </Text>
              </View>
            ) : null}
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>
        </View>
        <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

export function GlobalActivityListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const { data, loading } = useGlobalDashboard(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('spaces.globalDashboard.activityListTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  const onPressItem = async (item: GlobalActivityItem) => {
    const success = await switchSpace(item.spaceId);
    if (success) {
      invalidateAccommodationQueries();
      resetToDashboard(item.spaceId);
    }
  };

  const items = data?.recentActivity ?? [];

  const groups = useMemo(() => {
    const buckets: Record<ActivityBucket, GlobalActivityItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      earlier: [],
    };
    for (const item of items) {
      buckets[bucketFor(item.createdAt)].push(item);
    }
    return [
      {
        id: 'today' as const,
        label: t('spaces.globalDashboard.groups.today', { defaultValue: 'Today' }),
        items: buckets.today,
      },
      {
        id: 'yesterday' as const,
        label: t('spaces.globalDashboard.groups.yesterday', {
          defaultValue: 'Yesterday',
        }),
        items: buckets.yesterday,
      },
      {
        id: 'week' as const,
        label: t('spaces.globalDashboard.groups.week', { defaultValue: 'This week' }),
        items: buckets.week,
      },
      {
        id: 'earlier' as const,
        label: t('spaces.globalDashboard.groups.earlier', { defaultValue: 'Earlier' }),
        items: buckets.earlier,
      },
    ].filter(group => group.items.length > 0);
  }, [items, t]);

  const showInitialLoader = loading && items.length === 0;

  return (
    <Screen scrollable={false} contentStyle={styles.flexContent}>
      <View style={styles.header}>
        <MealFormHero
          icon={Activity}
          eyebrow={t('spaces.globalDashboard.activityEyebrow', {
            defaultValue: 'My Spaces',
          })}
          heading={t('spaces.globalDashboard.activityListTitle')}
          subheading={
            items.length > 0
              ? t('spaces.globalDashboard.activityCount', {
                  count: items.length,
                  defaultValue: '{{count}} recent updates',
                })
              : t('spaces.globalDashboard.activityEmptyBody')
          }
          compact
        />
      </View>

      {showInitialLoader ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={40} height={40} borderRadius={radius.button} />
              <View style={styles.skeletonBody}>
                <Skeleton width={'80%'} height={14} />
                <Skeleton width={'55%'} height={12} />
              </View>
            </View>
          ))}
          <SkeletonCard />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          Icon={Activity}
          title={t('spaces.globalDashboard.activityEmptyTitle')}
          description={t('spaces.globalDashboard.activityEmptyBody')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {groups.map(group => (
            <View key={group.id} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((item, index) => (
                <ActivityCard
                  key={item.notificationId}
                  item={item}
                  isLast={index === group.items.length - 1}
                  onPress={() => void onPressItem(item)}
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
    paddingTop: 0,
  },
  header: {
    paddingBottom: spacing.xs,
  },
  loadingWrap: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  skeletonBody: {
    flex: 1,
    gap: spacing.xs,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineRail: {
    width: 16,
    alignItems: 'center',
    paddingTop: 22,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: colors.border,
    minHeight: 24,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: colors.surface,
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
    gap: 2,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  spaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '60%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spaceChipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  time: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 11,
  },
});
