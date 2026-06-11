import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileHeaderButton } from './ProfileHeaderButton';
import { SpaceHeaderMenu } from './SpaceHeaderMenu';
import { spacing } from '../../theme';

type SpaceTabHeaderActionsProps = {
  spaceId: string;
  extra?: React.ReactNode;
  showProfileAndMenu?: boolean;
};

export function SpaceTabHeaderActions({
  spaceId,
  extra,
  showProfileAndMenu = false,
}: SpaceTabHeaderActionsProps) {
  if (!showProfileAndMenu && !extra) {
    return null;
  }

  return (
    <View style={styles.row}>
      {extra}
      {showProfileAndMenu ? (
        <>
          <ProfileHeaderButton />
          <SpaceHeaderMenu spaceId={spaceId} />
        </>
      ) : null}
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
