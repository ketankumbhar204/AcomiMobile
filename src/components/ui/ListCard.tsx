import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { InlineEditableName } from './InlineEditableName';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ListCardProps = {
  title: string;
  subtitle?: string;
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
      </View>
      <Text style={styles.chevron}>›</Text>
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
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  pressed: {
    borderColor: `${colors.primary}66`,
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
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.muted,
  },
});
