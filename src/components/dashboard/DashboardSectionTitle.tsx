import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type DashboardSectionTitleProps = {
  title: string;
  /** Optional smaller line under the title (e.g. period label). */
  subtitle?: string;
};

export function DashboardSectionTitle({
  title,
  subtitle,
}: DashboardSectionTitleProps) {
  return (
    <View style={[styles.wrap, subtitle ? styles.wrapWithSubtitle : null]}>
      <Text style={styles.title}>{title}</Text>
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
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
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
