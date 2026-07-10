import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { GlobalAttentionSpace } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const PREVIEW_LIMIT = 3;

type GlobalAttentionCardProps = {
  spaces: GlobalAttentionSpace[];
  totalCount: number;
  onPressSpace: (space: GlobalAttentionSpace) => void;
  onViewAll?: () => void;
};

export function GlobalAttentionCard({
  spaces,
  totalCount,
  onPressSpace,
  onViewAll,
}: GlobalAttentionCardProps) {
  const { t } = useTranslation();
  const preview = spaces.slice(0, PREVIEW_LIMIT);
  const hasMore = spaces.length > PREVIEW_LIMIT;

  if (spaces.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t('spaces.globalDashboard.attentionTitle', { count: 0 })}
        </Text>
        <Text style={styles.emptyTitle}>{t('spaces.globalDashboard.attentionEmptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('spaces.globalDashboard.attentionEmptyBody')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {t('spaces.globalDashboard.attentionTitle', { count: totalCount })}
      </Text>
      {preview.map(space => (
        <Pressable
          key={space.spaceId}
          onPress={() => onPressSpace(space)}
          style={({ pressed }) => [styles.spaceRow, pressed && styles.pressed]}>
          <Text style={styles.spaceName}>{space.spaceName}</Text>
          {space.items.map(item => (
            <Text key={`${space.spaceId}-${item.actionType}`} style={styles.itemLine}>
              • {item.count > 1 ? `${item.count} ` : ''}
              {item.title}
            </Text>
          ))}
        </Pressable>
      ))}
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
    backgroundColor: '#FFFBEB',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#F59E0B55',
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: '#B45309',
    marginBottom: spacing.xs,
  },
  spaceRow: {
    gap: 2,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  spaceName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
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
