import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react-native';
import { resetToMySpaces } from '../../navigation/navigationRef';
import { colors, radius } from '../../theme';

/** Leaves the current space for the account home (My Spaces or member home). */
export function SpaceTabHomeButton() {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => resetToMySpaces()}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('navigation.home', { defaultValue: 'Home' })}>
      <Home size={18} color={colors.teal} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
});
