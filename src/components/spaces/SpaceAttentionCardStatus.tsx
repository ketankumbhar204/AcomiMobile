import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import type { SpaceAttentionSummary } from '../../utils/spaceAttentionSummary';

type SpaceAttentionCardStatusProps = {
  summary: SpaceAttentionSummary | undefined;
  /** While first load is in progress, omit the "up to date" placeholder. */
  loading?: boolean;
};

/** Compact attention status for customer/tenant My Spaces cards (up to 2 items). */
export function SpaceAttentionCardStatus({
  summary,
  loading = false,
}: SpaceAttentionCardStatusProps) {
  const { t } = useTranslation();

  if (!summary) {
    if (loading) {
      return null;
    }
    return (
      <Text style={styles.upToDate}>{t('spaces.mySpaces.attentionUpToDate')}</Text>
    );
  }

  const items = summary.items?.length
    ? summary.items
    : summary.primary
      ? [summary.primary]
      : [];

  if (summary.totalCount <= 0 || items.length === 0) {
    return (
      <Text style={styles.upToDate}>{t('spaces.mySpaces.attentionUpToDate')}</Text>
    );
  }

  const showDetail = items.length === 1 && Boolean(items[0].detail);

  return (
    <View style={styles.wrap} accessibilityRole="text">
      {items.map(item => (
        <View key={item.actionType} style={styles.primaryRow}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Text style={styles.primaryTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
      ))}
      {showDetail ? (
        <Text style={styles.detail} numberOfLines={1}>
          {items[0].detail}
        </Text>
      ) : null}
      {summary.moreCount > 0 ? (
        <Text style={styles.more}>
          {t('spaces.mySpaces.attentionMoreUpdates', { count: summary.moreCount })}
        </Text>
      ) : null}
    </View>
  );
}

type SpaceAttentionCountBadgeProps = {
  count: number;
};

/** Small count pill for the card trailing edge. Hidden when count is 0. */
export function SpaceAttentionCountBadge({ count }: SpaceAttentionCountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <View style={styles.countBadge} accessibilityRole="text">
      <View style={styles.countDot} />
      <Text style={styles.countText}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 14,
  },
  primaryTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  detail: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: 20,
  },
  more: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 20,
    marginTop: 1,
  },
  upToDate: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  countDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  countText: {
    ...typography.caption,
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 12,
  },
});
