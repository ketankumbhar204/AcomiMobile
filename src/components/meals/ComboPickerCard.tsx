import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ComboPickerCardProps = {
  name: string;
  itemNames: string[];
  selected?: boolean;
  selectable?: boolean;
  compact?: boolean;
  onPress: () => void;
};

export function ComboPickerCard({
  name,
  itemNames,
  selected = false,
  selectable = true,
  compact = true,
  onPress,
}: ComboPickerCardProps) {
  const preview = itemNames.join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selectable ? selected : undefined }}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        selectable && selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.row}>
        {selectable ? (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            <Text style={[styles.checkboxMark, selected && styles.checkboxMarkSelected]}>
              {selected ? '✓' : ''}
            </Text>
          </View>
        ) : null}
        <View style={styles.content}>
          <Text style={[styles.name, selectable && selected && styles.nameSelected]}>{name}</Text>
          {preview.length > 0 ? (
            <Text style={styles.items} numberOfLines={1}>
              {preview}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardCompact: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#ECFDF5',
  },
  cardPressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    fontSize: 13,
    fontWeight: '700',
    color: 'transparent',
    lineHeight: 16,
  },
  checkboxMarkSelected: {
    color: colors.white,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: { ...typography.bodyStrong },
  nameSelected: { color: colors.primaryDark },
  items: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
