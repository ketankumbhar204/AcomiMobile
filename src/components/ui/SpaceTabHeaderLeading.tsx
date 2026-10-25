import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigationState, useRoute } from '@react-navigation/native';
import {
  focusedSpaceTabRouteName,
  spaceHeaderLeadingForRoute,
} from '../../navigation/spaceHeaderNav';
import { spacing } from '../../theme';
import { SpaceTabBackButton } from './SpaceTabBackButton';
import { SpaceTabHomeButton } from './SpaceTabHomeButton';

/**
 * Dashboard shows the home icon. Every other space tab shows the back arrow.
 * The active tab comes from navigation state, so switching tabs updates
 * the control immediately for every role that shares this header.
 */
export function SpaceTabHeaderLeading() {
  const route = useRoute();
  const focusedTab = useNavigationState(focusedSpaceTabRouteName);
  const showHome =
    spaceHeaderLeadingForRoute(focusedTab ?? route.name) === 'home';

  return (
    <View style={styles.row}>
      {showHome ? (
        <View style={styles.homeSlot}>
          <SpaceTabHomeButton />
        </View>
      ) : (
        <SpaceTabBackButton />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  homeSlot: {
    marginLeft: spacing.lg,
    marginRight: spacing.md,
  },
});
