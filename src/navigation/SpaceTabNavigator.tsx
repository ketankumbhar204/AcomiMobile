import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SpaceTabBackButton } from '../components/ui';
import { useSpaceTabHeader } from '../hooks/useSpaceTabHeader';
import { AccommodationHomeScreen } from '../screens/accommodation/AccommodationHomeScreen';
import { MembersScreen } from '../screens/MembersScreen';
import { useSpaceStore } from '../store/spaceStore';
import { tabBarOptions, tabHeaderOptions } from '../theme';
import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { ScreenPlaceholder } from './ScreenPlaceholder';
import type { SpaceTabParamList } from './types';

const Tab = createBottomTabNavigator<SpaceTabParamList>();

type SpaceTabNavigatorProps = {
  spaceId: string;
};

type TabRouteName = keyof SpaceTabParamList;

const TAB_TITLE_KEYS: Record<TabRouteName, string> = {
  Dashboard: 'navigation.dashboard',
  Members: 'navigation.members',
  Accommodation: 'navigation.accommodation',
  Meals: 'navigation.meals',
  Payments: 'navigation.payments',
  Complaints: 'navigation.complaints',
};

function createTabScreen(
  routeName: TabRouteName,
  options?: { showProfileAndMenu?: boolean },
) {
  return function TabScreen() {
    const { t } = useTranslation();
    const route = useRoute<RouteProp<SpaceTabParamList, typeof routeName>>();
    const { spaceId } = route.params;
    const title = t(TAB_TITLE_KEYS[routeName]);

    useSpaceTabHeader(spaceId, options);

    return <ScreenPlaceholder title={title} />;
  };
}

const DashboardScreen = createTabScreen('Dashboard', { showProfileAndMenu: true });
const MealsScreen = createTabScreen('Meals');
const PaymentsScreen = createTabScreen('Payments');
const ComplaintsScreen = createTabScreen('Complaints');

const tabScreenOptions = {
  ...tabHeaderOptions,
  ...tabBarOptions,
  headerBackVisible: false as const,
  headerLeft: () => <SpaceTabBackButton />,
};

export function SpaceTabNavigator({ spaceId }: SpaceTabNavigatorProps) {
  const { t, i18n } = useTranslation();
  const mySpaces = useSpaceStore(state => state.mySpaces);

  const showAccommodation = useMemo(() => {
    const spaceType = mySpaces.find(space => space.spaceId === spaceId)?.spaceType;
    return spaceType ? isAccommodationApplicable(spaceType) : true;
  }, [mySpaces, spaceId]);

  return (
    <Tab.Navigator
      key={`${spaceId}-${i18n.language}-${showAccommodation}`}
      screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.dashboard') }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        initialParams={{ spaceId }}
        options={{ headerShown: true, title: t('navigation.members') }}
      />
      {showAccommodation ? (
        <Tab.Screen
          name="Accommodation"
          component={AccommodationHomeScreen}
          initialParams={{ spaceId }}
          options={{ title: t('navigation.accommodation') }}
        />
      ) : null}
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.meals') }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.payments') }}
      />
      <Tab.Screen
        name="Complaints"
        component={ComplaintsScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.complaints') }}
      />
    </Tab.Navigator>
  );
}
