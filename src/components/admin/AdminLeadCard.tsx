import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';

type AdminLeadCardProps = {
  title: string;
  subtitle: string;
  meta: string;
  sourceLabel?: string;
  testLead?: boolean;
  showDelete?: boolean;
  actionLabel?: string;
  onPress?: () => void;
  onDelete?: () => void;
};

export function AdminLeadCard({
  title,
  subtitle,
  meta,
  sourceLabel,
  testLead,
  showDelete,
  actionLabel,
  onPress,
  onDelete,
}: AdminLeadCardProps) {
  const { t } = useTranslation();

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
            {testLead != null ? (
              <Text style={[styles.testBadge, testLead && styles.testBadgeActive]}>
                {testLead ? t('admin.labels.testYes') : t('admin.labels.testNo')}
              </Text>
            ) : null}
            {actionLabel ? <Text style={styles.actionBadge}>{actionLabel}</Text> : null}
          </View>
        </View>
        {onPress ? <ChevronRight size={18} color={colors.muted} /> : null}
      </Pressable>
      {showDelete && onDelete ? (
        <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <Text style={styles.deleteText}>{t('admin.common.delete')}</Text>
        </Pressable>
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
    color: colors.textSecondary,
  },
  testBadgeActive: {
    color: colors.warning,
    fontWeight: '600',
  },
  actionBadge: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '700',
  },
  deleteBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  deleteText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
});
