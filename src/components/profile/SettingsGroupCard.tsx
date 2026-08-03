import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { DashboardSectionHeader } from '../dashboard/shared/DashboardSectionHeader';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type SettingsGroupCardProps = {
  title: string;
  icon: LucideIcon;
  description?: string;
  accent?: string;
  children: React.ReactNode;
};

/** Grouped settings card — section header + soft elevated body. */
export function SettingsGroupCard({
  title,
  icon,
  description,
  accent = colors.primaryDark,
  children,
}: SettingsGroupCardProps) {
  return (
    <View style={styles.wrap}>
      <DashboardSectionHeader title={title} icon={icon} accent={accent} />
      <View style={styles.body}>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  body: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
});
