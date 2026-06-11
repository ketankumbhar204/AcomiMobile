import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedUserId } from '../../hooks/useAuth';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { isSpaceOwner } from '../../utils/spaceOwnership';
import {
  HeaderOverflowMenu,
  type HeaderOverflowMenuItem,
} from './HeaderOverflowMenu';

type MainNav = NativeStackNavigationProp<MainStackParamList>;

type SpaceHeaderMenuProps = {
  spaceId: string;
};

export function SpaceHeaderMenu({ spaceId }: SpaceHeaderMenuProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const currentUserId = useAuthenticatedUserId();
  const selectedSpace = useSpaceStore(state => state.selectedSpace);

  const owner = isSpaceOwner(selectedSpace, currentUserId);

  const stackNavigation =
    navigation.getParent<MainNav>() ?? (navigation as MainNav);

  const items = useMemo<HeaderOverflowMenuItem[]>(
    () => [
      {
        id: 'space-details',
        label: t('navigation.spaceDetails'),
        onPress: () => {
          console.log('[SpaceHeaderMenu] navigate SpaceDetails', spaceId);
          stackNavigation.navigate('SpaceDetails', { spaceId });
        },
      },
      {
        id: 'edit-space',
        label: t('navigation.editSpace'),
        visible: owner,
        onPress: () => {
          console.log('[SpaceHeaderMenu] navigate EditSpace', spaceId);
          stackNavigation.navigate('EditSpace', { spaceId });
        },
      },
    ],
    [owner, spaceId, stackNavigation, t],
  );

  return (
    <HeaderOverflowMenu
      items={items}
      accessibilityLabel={t('spaces.menu.open')}
    />
  );
}
