import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { Card } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { isMarkedTestLead } from '../../utils/adminTestLead';

type AdminLeadCardProps = {
  title: string;
  subtitle: string;
  meta: string;
  sourceLabel?: string;
  testLead?: boolean;
  showDelete?: boolean;
  showShare?: boolean;
  actionLabel?: string;
  footer?: ReactNode;
  onPress?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
};

export function AdminLeadCard({
  title,
  subtitle,
  meta,
  sourceLabel,
  testLead,
  showDelete,
  showShare,
  actionLabel,
  footer,
  onPress,
  onDelete,
  onShare,
}: AdminLeadCardProps) {
  const { t } = useTranslation();
  const hasActions = (showDelete && !!onDelete) || (showShare && !!onShare);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={title}
        style={styles.row}>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
          <View style={styles.badges}>
            {sourceLabel ? (
              <Text style={styles.sourceBadge} numberOfLines={1}>
                {sourceLabel}
              </Text>
            ) : null}
            {isMarkedTestLead(testLead) ? (
              <Text style={styles.testBadge}>{t('admin.labels.testBadge')}</Text>
            ) : null}
            {actionLabel ? <Text style={styles.actionBadge}>{actionLabel}</Text> : null}
          </View>
          {footer}
        </View>
        {onPress ? <ChevronRight size={18} color={colors.muted} /> : null}
      </Pressable>
      {hasActions ? (
        <View style={styles.actionsRow}>
          {showShare && onShare ? (
            <Pressable style={styles.shareBtn} onPress={onShare} hitSlop={8}>
              <Text style={styles.shareText}>{t('admin.marketing.share')}</Text>
            </Pressable>
          ) : null}
          {showDelete && onDelete ? (
            <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
              <Text style={styles.deleteText}>{t('admin.common.delete')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  body: { flex: 1, minWidth: 0 },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sourceBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    flexShrink: 1,
  },
  testBadge: {
    ...typography.caption,
    color: colors.white,
    backgroundColor: '#EF4444',
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  actionBadge: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '700',
  },
  actionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'center',
  },
  shareBtn: { alignSelf: 'flex-start' },
  shareText: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '700',
  },
  deleteBtn: { alignSelf: 'flex-start' },
  deleteText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
});
