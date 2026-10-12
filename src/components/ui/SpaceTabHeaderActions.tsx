import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { NotificationBellButton } from '../notifications/NotificationBellButton';
import { spacing } from '../../theme';
import { SpaceHeaderMenu } from './SpaceHeaderMenu';

type SpaceTabHeaderActionsProps = {
  spaceId: string;
  extra?: ReactNode;
  showOverflowMenu?: boolean;
};

export function SpaceTabHeaderActions({
  spaceId,
  extra,
  showOverflowMenu = true,
}: SpaceTabHeaderActionsProps) {
  return (
    <View style={styles.row}>
      {extra}
      <NotificationBellButton spaceId={spaceId} />
      {showOverflowMenu ? <SpaceHeaderMenu spaceId={spaceId} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: spacing.xs,
  },
});
