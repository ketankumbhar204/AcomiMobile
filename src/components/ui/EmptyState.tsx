import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from './Card';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Emoji / glyph fallback (legacy). Prefer `Icon` for Design A. */
  icon?: string;
  Icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  icon = '○',
  Icon,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          {Icon ? (
            <Icon size={18} color={colors.primaryDark} strokeWidth={2.2} />
          ) : (
            <Text style={styles.icon}>{icon}</Text>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 18,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
