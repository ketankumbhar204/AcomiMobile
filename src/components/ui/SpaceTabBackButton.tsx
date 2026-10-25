import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { resetToMySpaces } from '../../navigation/navigationRef';
import {
  spaceDashboardHeaderDestination,
  spaceTabHeaderBackAncestorIndex,
  type SpaceTabBackAncestor,
} from '../../navigation/spaceHeaderNav';
import type { MainStackParamList } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../theme';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { devLog } from '../../utils/devLog';

type MainNav = NativeStackNavigationProp<MainStackParamList>;

const MAX_BACK_ANCESTORS = 8;

/**
 * Pop the previous stack screen. Skip tab navigators so this control does
 * not switch to Dashboard (tab backBehavior is firstRoute). Hardware back
 * still uses the navigator history and is unchanged.
 */
function goBackAboveSpaceTabs(navigation: NavigationProp<ParamListBase>): boolean {
  const ancestors: SpaceTabBackAncestor[] = [];
  const navigators: NavigationProp<ParamListBase>[] = [];
  let parent = navigation.getParent();

  while (parent && ancestors.length < MAX_BACK_ANCESTORS) {
    const state = parent.getState();
    ancestors.push({
      type: state?.type,
      index: state?.index,
    });
    navigators.push(parent);
    parent = parent.getParent();
  }

  const index = spaceTabHeaderBackAncestorIndex(ancestors);
  if (index == null) {
    return false;
  }

  navigators[index]?.goBack();
  return true;
}

export function SpaceTabBackButton() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handlePress = () => {
    const wentBack = goBackAboveSpaceTabs(navigation);
    if (spaceDashboardHeaderDestination('back', wentBack) === 'previous') {
      return;
    }

    const stackNavigation =
      navigation.getParent<MainNav>() ?? (navigation as MainNav);

    if (stackNavigation?.navigate) {
      devLog('[SpaceTabBackButton] navigate MemberTabs');
      stackNavigation.navigate('MemberTabs', { screen: 'Home' });
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
      accessibilityLabel={t('navigation.goBack')}>
      <ChevronLeftIcon size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: spacing.xs,
    minWidth: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: 0.5,
  },
});
