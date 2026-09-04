import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HeaderLanguageButton } from '../settings/HeaderLanguageButton';
import { ProfileHeaderButton } from './ProfileHeaderButton';
import { SpaceHeaderMenu } from './SpaceHeaderMenu';
import { spacing } from '../../theme';

type SpaceTabHeaderActionsProps = {
  spaceId: string;
  extra?: React.ReactNode;
  /** Profile avatar — typically Dashboard only */
  showProfile?: boolean;
  /** Header ⋮ overflow with secondary navigation */
  showOverflowMenu?: boolean;
  /** Compact language control (default on) */
  showLanguage?: boolean;
  /** @deprecated Prefer showProfile + showOverflowMenu */
  showProfileAndMenu?: boolean;
};

export function SpaceTabHeaderActions({
  spaceId,
  extra,
  showProfile,
  showOverflowMenu,
  showLanguage = true,
  showProfileAndMenu = false,
}: SpaceTabHeaderActionsProps) {
  const profile = showProfile ?? showProfileAndMenu;
  const overflow = showOverflowMenu ?? showProfileAndMenu;

  if (!profile && !overflow && !extra && !showLanguage) {
    return null;
  }

  return (
    <View style={styles.row}>
      {extra}
      {showLanguage ? <HeaderLanguageButton /> : null}
      {profile ? <ProfileHeaderButton /> : null}
      {overflow ? <SpaceHeaderMenu spaceId={spaceId} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.xs,
  },
});
