import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';

type AdminLeadCardProps = {
  title: string;
  subtitle: string;
  meta: string;
  sourceLabel?: string;
  testLead?: boolean;
  showDelete?: boolean;
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
  onPress,
  onDelete,
}: AdminLeadCardProps) {
  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{subtitle}</Text>
        <Text style={styles.meta}>{meta}</Text>
        <View style={styles.badges}>
          {sourceLabel ? <Text style={styles.sourceBadge}>{sourceLabel}</Text> : null}
          {testLead != null ? (
            <Text style={[styles.testBadge, testLead && styles.testBadgeActive]}>
              Test: {testLead ? 'Yes' : 'No'}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {showDelete && onDelete ? (
        <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
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
  },
  testBadge: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  testBadgeActive: {
    color: colors.warning,
    fontWeight: '600',
  },
  deleteBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  deleteText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
});
