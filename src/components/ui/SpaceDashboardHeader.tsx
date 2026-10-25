import React, { useContext, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HeaderShownContext } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { SpaceSwitcher } from './SpaceSwitcher';
import { SpaceTabHeaderActions } from './SpaceTabHeaderActions';
import { SpaceTabHeaderLeading } from './SpaceTabHeaderLeading';

type SpaceDashboardHeaderProps = {
  spaceId: string;
  extra?: ReactNode;
  showOverflowMenu?: boolean;
};

/**
 * Shared space-tab header. The title sits in the leftover width between the
 * leading control and the trailing actions, so icons cannot cover the name.
 */
export function SpaceDashboardHeader({
  spaceId,
  extra,
  showOverflowMenu = true,
}: SpaceDashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const parentHeaderShown = useContext(HeaderShownContext);
  const statusBarHeight = parentHeaderShown ? 0 : insets.top;

  return (
    <View style={[styles.bar, { paddingTop: statusBarHeight }]}>
      <View style={styles.row}>
        <SpaceTabHeaderLeading />
        <View style={styles.title}>
          <SpaceSwitcher spaceId={spaceId} />
        </View>
        <SpaceTabHeaderActions
          spaceId={spaceId}
          extra={extra}
          showOverflowMenu={showOverflowMenu}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.white,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
});
