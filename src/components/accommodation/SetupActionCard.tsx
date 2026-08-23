import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, shadows, spacing, typography } from '../../theme';

type SetupActionCardProps = {
  title: string;
  subtitle: string;
  description?: string;
  icon: LucideIcon;
  accent: string;
  well: string;
  onPress: () => void;
};

/** Compact native action card: icon | copy | chevron. No illustrations. */
export const SetupActionCard = memo(function SetupActionCard({
  title,
  subtitle,
  description,
  icon: Icon,
  accent,
  well,
  onPress,
}: SetupActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.iconWell, { backgroundColor: well }]}>
        <Icon size={20} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.3} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    minHeight: 92,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateX: 1 }],
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
});
