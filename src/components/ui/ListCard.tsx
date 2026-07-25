import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { InlineEditableName } from './InlineEditableName';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ListCardProps = {
  title: string;
  subtitle?: string;
  /** Optional status row under the subtitle (e.g. pending actions). */
  status?: React.ReactNode;
  /** Optional badge rendered on the trailing edge before the chevron. */
  trailingBadge?: React.ReactNode;
  iconLabel?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  style?: StyleProp<ViewStyle>;
};

export function ListCard({
  title,
  subtitle,
  status,
  trailingBadge,
  iconLabel,
  onPress,
  onLongPress,
  editableName = false,
  onSaveName,
  style,
}: ListCardProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      {iconLabel ? (
        <View style={styles.icon}>
          <Text style={styles.iconText}>{iconLabel}</Text>
        </View>
      ) : null}
      <View style={styles.info}>
        <InlineEditableName
          value={title}
          editable={editableName}
          onSave={onSaveName}
        />
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {status ? <View style={styles.status}>{status}</View> : null}
      </View>
      {trailingBadge ? <View style={styles.trailingBadge}>{trailingBadge}</View> : null}
      {onPress ? <ChevronRight size={20} color={colors.muted} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    minHeight: 64,
    ...shadows.sm,
  },
  pressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    marginTop: spacing.xxs,
    color: colors.textSecondary,
  },
  status: {
    marginTop: spacing.xs,
  },
  trailingBadge: {
    flexShrink: 0,
    marginRight: spacing.xxs,
  },
});
