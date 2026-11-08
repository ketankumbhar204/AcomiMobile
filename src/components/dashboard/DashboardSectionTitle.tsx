import React from 'react';
import { StyleSheet, Text, View, type ReactNode } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type DashboardSectionTitleProps = {
  title: string;
  /** Optional smaller line under the title (e.g. period label). */
  subtitle?: string;
  /** Optional control on the title row, right-aligned (same line as title). */
  trailing?: ReactNode;
};

export function DashboardSectionTitle({
  title,
  subtitle,
  trailing,
}: DashboardSectionTitleProps) {
  return (
    <View style={[styles.wrap, subtitle ? styles.wrapWithSubtitle : null]}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Title (no subtitle) → content: 12dp */
  wrap: {
    marginBottom: spacing.md,
  },
  /** Subtitle → content: 8dp */
  wrapWithSubtitle: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    flexShrink: 1,
  },
  trailing: {
    flexShrink: 0,
    marginLeft: 'auto',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 14,
    color: colors.muted,
    fontWeight: '500',
    marginTop: 2,
  },
});
