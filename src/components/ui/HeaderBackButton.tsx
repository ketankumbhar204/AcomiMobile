import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../theme';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

function canNavigateBack(navigation: NavigationProp<ParamListBase>): boolean {
  if (navigation.canGoBack()) {
    return true;
  }

  let parent = navigation.getParent();
  while (parent) {
    if (parent.canGoBack()) {
      return true;
    }
    parent = parent.getParent();
  }

  return false;
}

function goBack(navigation: NavigationProp<ParamListBase>) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  let parent = navigation.getParent();
  while (parent) {
    if (parent.canGoBack()) {
      parent.goBack();
      return;
    }
    parent = parent.getParent();
  }
}

export function HeaderBackButton({ onPress }: { onPress?: () => void }) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  if (!onPress && !canNavigateBack(navigation)) {
    return null;
  }

  return (
    <Pressable
      onPress={() => (onPress ? onPress() : goBack(navigation))}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('navigation.goBack')}>
      <ChevronLeftIcon size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: spacing.sm,
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    opacity: 0.5,
  },
});
