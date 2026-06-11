import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedUser } from '../../hooks/useAuth';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type MainNav = NativeStackNavigationProp<MainStackParamList>;

export function ProfileHeaderButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const user = useAuthenticatedUser();

  const stackNavigation =
    navigation.getParent<MainNav>() ?? (navigation as MainNav);

  return (
    <Pressable
      onPress={() => stackNavigation.navigate('Profile')}
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
