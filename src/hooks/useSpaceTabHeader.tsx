import { useLayoutEffect, type ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SpaceDashboardHeader } from '../components/ui/SpaceDashboardHeader';
import { useSpaceStore } from '../store/spaceStore';
import type { MainStackParamList } from '../navigation/types';

type SpaceHeaderOptions = {
  /** Extra control rendered before the notification bell, such as Invite. */
  headerRightExtra?: ReactNode;
  /** Kept for existing callers. Profile now lives in the overflow menu. */
  showProfileAndMenu?: boolean;
  /** Show the ⋮ overflow menu. Defaults to true. */
  showOverflowMenu?: boolean;
  /** Language selection lives on Profile. Ignored on space headers. */
  showLanguage?: boolean;
};

export function useSpaceTabHeader(spaceId: string, options?: SpaceHeaderOptions) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { i18n } = useTranslation();
  const currentSpace = useSpaceStore(state => state.currentSpace);
  const loadSpaceDetails = useSpaceStore(state => state.loadSpaceDetails);
  const showOverflowMenu = options?.showOverflowMenu !== false;
  const headerRightExtra = options?.headerRightExtra;

  useLayoutEffect(() => {
    if (currentSpace?.spaceId === spaceId) {
      return;
    }
    void loadSpaceDetails(spaceId);
  }, [currentSpace?.spaceId, loadSpaceDetails, spaceId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <SpaceDashboardHeader
          spaceId={spaceId}
          extra={headerRightExtra}
          showOverflowMenu={showOverflowMenu}
        />
      ),
    });
  }, [headerRightExtra, i18n.language, navigation, showOverflowMenu, spaceId]);
}
