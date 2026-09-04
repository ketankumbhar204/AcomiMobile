import React from 'react';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  SpaceSwitcher,
  SpaceTabBackButton,
  SpaceTabHeaderActions,
} from '../components/ui';
import { useSpaceStore } from '../store/spaceStore';

type UseSpaceTabHeaderOptions = {
  headerRightExtra?: React.ReactNode;
  /** Profile avatar — Dashboard (and similar) only */
  showProfileAndMenu?: boolean;
  /**
   * Overflow ⋮ menu with secondary nav (Complaints, Menu Library, …).
   * Defaults to true so More items are reachable from every space tab.
   */
  showOverflowMenu?: boolean;
};

export function useSpaceTabHeader(
  spaceId: string,
  options?: UseSpaceTabHeaderOptions,
) {
  const { i18n } = useTranslation();
  const navigation = useNavigation();
  const currentSpace = useSpaceStore(state => state.currentSpace);
  const loadSpaceDetails = useSpaceStore(state => state.loadSpaceDetails);
  const showOverflowMenu = options?.showOverflowMenu !== false;
  const showProfileAndMenu = options?.showProfileAndMenu === true;

  useLayoutEffect(() => {
    if (currentSpace?.spaceId !== spaceId) {
      loadSpaceDetails(spaceId);
    }
  }, [currentSpace?.spaceId, loadSpaceDetails, spaceId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <SpaceSwitcher spaceId={spaceId} />,
      headerBackVisible: false,
      headerLeft: () => <SpaceTabBackButton />,
      headerRight: () => {
        // Always show at least language (+ optional profile / overflow / extras).
        return (
          <SpaceTabHeaderActions
            spaceId={spaceId}
            extra={options?.headerRightExtra}
            showProfile={showProfileAndMenu}
            showOverflowMenu={showOverflowMenu}
            showLanguage
          />
        );
      },
    });
  }, [
    navigation,
    options?.headerRightExtra,
    showOverflowMenu,
    showProfileAndMenu,
    spaceId,
    currentSpace?.spaceId,
    i18n.language,
  ]);
}
