import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type MemberListCardProps = {
  title: string;
  subtitle?: string;
  iconLabel?: string;
  onPress: () => void;
  trailing: React.ReactNode;
};

export function MemberListCard({
  title,
  subtitle,
  iconLabel,
  onPress,
  trailing,
}: MemberListCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.left, pressed && styles.leftPressed]}
        accessibilityRole="button">
        {iconLabel ? (
          <View style={styles.icon}>
            <Text style={styles.iconText}>{iconLabel}</Text>
          </View>
        ) : null}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.divider} />
      <View style={styles.trailing}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
    overflow: 'hidden',
    ...shadows.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    minWidth: 0,
  },
  leftPressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  trailing: {
    justifyContent: 'center',
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
  },
});
