import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedUser } from '../../hooks/useAuth';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { colors } from '../../theme';

export function ProfileHeaderButton() {
  const { t } = useTranslation();
  const user = useAuthenticatedUser();

  return (
    <Pressable
      onPress={() => navigateMainStack('Profile', undefined)}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('spaces.mySpaces.openProfile')}>
      <Text style={styles.label}>
        {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    includeFontPadding: false,
  },
});
