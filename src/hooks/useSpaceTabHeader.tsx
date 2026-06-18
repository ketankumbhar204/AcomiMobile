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
  /** Profile avatar + overflow menu — Dashboard only */
  showProfileAndMenu?: boolean;
};

export function useSpaceTabHeader(
  spaceId: string,
  options?: UseSpaceTabHeaderOptions,
) {
  const { i18n } = useTranslation();
  const navigation = useNavigation();
  const currentSpace = useSpaceStore(state => state.currentSpace);
  const loadSpaceDetails = useSpaceStore(state => state.loadSpaceDetails);

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
        if (options?.showProfileAndMenu || options?.headerRightExtra) {
          return (
            <SpaceTabHeaderActions
              spaceId={spaceId}
              extra={options?.headerRightExtra}
              showProfileAndMenu={options?.showProfileAndMenu}
            />
          );
        }
        return null;
      },
    });
  }, [
    navigation,
    options?.headerRightExtra,
    options?.showProfileAndMenu,
    spaceId,
    currentSpace?.spaceId,
    i18n.language,
  ]);
}
