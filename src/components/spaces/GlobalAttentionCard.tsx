import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react-native';
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
        <View style={styles.okIconWrap}>
          <CheckCircle2 size={22} color={colors.success} strokeWidth={2.2} />
        </View>
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
        <View style={styles.warnIconWrap}>
          <AlertTriangle size={20} color="#D97706" strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{t('spaces.globalDashboard.needsAttention')}</Text>
        <ChevronRight size={18} color="#92400E" strokeWidth={2.4} />
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warningTint,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
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
  warnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: '#92400E',
    flex: 1,
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#F59E0B55',
  },
  okCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  okIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.success,
    fontSize: 16,
    flex: 1,
  },
});
