import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedUserId } from '../../hooks/useAuth';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import {
  spaceMoreItemsForPermissions,
  type SpaceMoreItemId,
} from '../../navigation/spaceTabRoutes';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { isSpaceOwner } from '../../utils/spaceOwnership';
import {
  HeaderOverflowMenu,
  type HeaderOverflowMenuItem,
} from './HeaderOverflowMenu';
import { devLog } from '../../utils/devLog';

type MainNav = NativeStackNavigationProp<MainStackParamList>;
type SpaceTabNav = {
  navigate: (name: keyof SpaceTabParamList, params?: SpaceTabParamList[keyof SpaceTabParamList]) => void;
};

type SpaceHeaderMenuProps = {
  spaceId: string;
};

function moreItemLabel(
  id: SpaceMoreItemId,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  switch (id) {
    case 'complaints':
      return t('navigation.complaints');
    case 'menuLibrary':
      return t('navigation.moreMenu.menuLibrary', { defaultValue: 'Menu Library' });
    case 'mealSubscriptionPlans':
      return t('navigation.moreMenu.mealSubscriptionPlans', {
        defaultValue: 'Meal Subscription Plans',
      });
    default:
      return id;
  }
}

export function SpaceHeaderMenu({ spaceId }: SpaceHeaderMenuProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const currentUserId = useAuthenticatedUserId();
  const selectedSpace = useSpaceStore(state => state.selectedSpace);
  const permissions = useSpacePermissions(spaceId);

  const owner = isSpaceOwner(selectedSpace, currentUserId);

  const stackNavigation =
    navigation.getParent<MainNav>() ?? (navigation as MainNav);
  const tabNavigation = navigation as unknown as SpaceTabNav;

  const moreItems = useMemo(
    () =>
      spaceMoreItemsForPermissions({
        canManageMeals: permissions.canManageMeals,
      }),
    [permissions.canManageMeals],
  );

  const items = useMemo<HeaderOverflowMenuItem[]>(() => {
    const secondary: HeaderOverflowMenuItem[] = moreItems.map(item => ({
      id: `more-${item.id}`,
      label: moreItemLabel(item.id, t),
      onPress: () => {
        switch (item.id) {
          case 'complaints':
            tabNavigation.navigate('Complaints', { spaceId });
            break;
          case 'menuLibrary':
            navigateMainStack('MenuLibrary', { spaceId });
            break;
          case 'mealSubscriptionPlans':
            navigateMainStack('SubscriptionPlans', { spaceId });
            break;
          default:
            break;
        }
      },
    }));

    return [
      ...secondary,
      {
        id: 'space-details',
        label: t('navigation.spaceDetails'),
        onPress: () => {
          devLog('[SpaceHeaderMenu] navigate SpaceDetails', spaceId);
          stackNavigation.navigate('SpaceDetails', { spaceId });
        },
      },
      {
        id: 'edit-space',
        label: t('navigation.editSpace'),
        visible: owner,
        onPress: () => {
          devLog('[SpaceHeaderMenu] navigate EditSpace', spaceId);
          stackNavigation.navigate('EditSpace', { spaceId });
        },
      },
    ];
  }, [moreItems, owner, spaceId, stackNavigation, t, tabNavigation]);

  return (
    <HeaderOverflowMenu
      items={items}
      accessibilityLabel={t('spaces.menu.open')}
    />
  );
}
