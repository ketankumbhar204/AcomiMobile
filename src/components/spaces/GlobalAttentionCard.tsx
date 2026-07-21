import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type GlobalAttentionCardProps = {
  /** Spaces that currently have pending actions. */
  spaceCount: number;
  /** Total pending-action items across spaces. */
  totalCount: number;
  onPress: () => void;
};

/**
 * Compact Needs Attention summary for My Spaces.
 * Numbers only — no per-item bullet lists (those live inside each space).
 */
export function GlobalAttentionCard({
  spaceCount,
  totalCount,
  onPress,
}: GlobalAttentionCardProps) {
  const { t } = useTranslation();

  if (totalCount <= 0) {
    return (
      <View
        style={styles.okCard}
        accessibilityRole="summary"
        accessibilityLabel={t('spaces.globalDashboard.attentionOk')}>
        <Text style={styles.okIcon}>✅</Text>
        <Text style={styles.okTitle}>{t('spaces.globalDashboard.attentionOk')}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('spaces.globalDashboard.attentionA11y', {
        spaces: spaceCount,
        count: totalCount,
      })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>⚠</Text>
        <Text style={styles.title}>{t('spaces.globalDashboard.needsAttention')}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{spaceCount}</Text>
          <Text style={styles.statLabel}>
            {t('spaces.globalDashboard.spacesLabel', { count: spaceCount })}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>
            {t('spaces.globalDashboard.pendingActionsShort', { count: totalCount })}
          </Text>
        </View>
      </View>
      <Text style={styles.cta}>{t('spaces.globalDashboard.viewArrow')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    minHeight: 112,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 22,
    color: '#B45309',
  },
  title: {
    ...typography.h2,
    color: '#92400E',
    fontSize: 22,
    lineHeight: 28,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statNumber: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 18,
    color: '#92400E',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#F59E0B55',
  },
  cta: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primaryDark,
    fontSize: 16,
  },
  okCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  okIcon: {
    fontSize: 22,
  },
  okTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.success,
    fontSize: 17,
    flex: 1,
  },
});
