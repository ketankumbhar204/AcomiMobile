import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, shadows } from '../../theme';

type FABProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  inline?: boolean;
  open?: boolean;
};

export function FAB({
  onPress,
  accessibilityLabel,
  inline = false,
  open = false,
}: FABProps) {
  const { t } = useTranslation();
  const label = accessibilityLabel ?? t('common.fabAction');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        inline && styles.fabInline,
        pressed && styles.fabPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={[styles.icon, open && styles.iconOpen]} allowFontScaling={false}>
        {open ? '×' : '+'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabInline: {
    position: 'relative',
    bottom: undefined,
    right: undefined,
  },
  fabPressed: {
    backgroundColor: colors.primaryHover,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
    color: colors.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  iconOpen: {
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '400',
  },
});
