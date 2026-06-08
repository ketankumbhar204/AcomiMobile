import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from './Card';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string;
};

export function EmptyState({ title, description, icon = '○' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
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
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
  },
});
