import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { GlobalActivityItem } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComplaintDateTime } from '../../utils/complaintStatus';

const PREVIEW_LIMIT = 5;

type RecentActivityCardProps = {
  items: GlobalActivityItem[];
  onPressItem: (item: GlobalActivityItem) => void;
  onViewAll?: () => void;
};

function activityIcon(category: GlobalActivityItem['category']): string {
  switch (category) {
    case 'SUCCESS':
      return '✓';
    case 'WARNING':
      return '!';
    case 'ERROR':
      return '✕';
    default:
      return '•';
  }
}

export function RecentActivityCard({
  items,
  onPressItem,
  onViewAll,
}: RecentActivityCardProps) {
  const { t } = useTranslation();
  const preview = items.slice(0, PREVIEW_LIMIT);
  const hasMore = items.length > PREVIEW_LIMIT;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('spaces.globalDashboard.activityTitle')}</Text>
      {preview.length === 0 ? (
        <>
          <Text style={styles.emptyTitle}>{t('spaces.globalDashboard.activityEmptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('spaces.globalDashboard.activityEmptyBody')}</Text>
        </>
      ) : (
        preview.map(item => (
          <Pressable
            key={item.notificationId}
            onPress={() => onPressItem(item)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.icon}>{activityIcon(item.category)}</Text>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.spaceName ?? ''}
                {item.createdAt ? ` · ${formatComplaintDateTime(item.createdAt)}` : ''}
              </Text>
            </View>
          </Pressable>
        ))
      )}
      {hasMore && onViewAll ? (
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>{t('spaces.globalDashboard.viewAll')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
    width: 18,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
  },
  meta: {
    ...typography.caption,
  },
  viewAll: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  emptyBody: {
    ...typography.caption,
  },
});
