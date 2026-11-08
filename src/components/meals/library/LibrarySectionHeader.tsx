import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../theme';

type LibrarySectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'link' | 'pill';
  actionTestID?: string;
};

export function LibrarySectionHeader({
  title,
  actionLabel,
  onAction,
  actionVariant = 'link',
  actionTestID,
}: LibrarySectionHeaderProps) {
  const showAction = Boolean(actionLabel && onAction);

  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {showAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            actionVariant === 'pill' ? styles.pill : styles.link,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          testID={actionTestID}
          hitSlop={6}>
          {actionVariant === 'pill' ? (
            <Plus size={14} color={colors.primaryDark} strokeWidth={2.4} />
          ) : null}
          <Text style={actionVariant === 'pill' ? styles.pillLabel : styles.linkLabel} numberOfLines={1}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
    fontWeight: '700',
  },
  link: {
    flexShrink: 0,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  linkLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  pill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
  },
  pillLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
