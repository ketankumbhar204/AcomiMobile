import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { resetToMySpaces } from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { devLog } from '../../utils/devLog';

type MainNav = NativeStackNavigationProp<MainStackParamList>;

function goBackInStack(navigation: NavigationProp<ParamListBase>): boolean {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return true;
  }

  let parent = navigation.getParent();
  while (parent) {
    if (parent.canGoBack()) {
      parent.goBack();
      return true;
    }
    parent = parent.getParent();
  }

  return false;
}

export function SpaceTabBackButton() {
  const navigation = useNavigation();

  const handlePress = () => {
    if (goBackInStack(navigation)) {
      return;
    }

    const stackNavigation =
      navigation.getParent<MainNav>() ?? (navigation as MainNav);

    if (stackNavigation?.navigate) {
      devLog('[SpaceTabBackButton] navigate MySpaces');
      stackNavigation.navigate('MySpaces');
      return;
    }

    devLog('[SpaceTabBackButton] reset MySpaces');
    resetToMySpaces();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back">
      <ChevronLeftIcon size={22} />
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
