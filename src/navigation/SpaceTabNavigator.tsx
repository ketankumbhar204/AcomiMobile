import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SpaceTabBackButton } from '../components/ui';
import { useSpaceTabHeader } from '../hooks/useSpaceTabHeader';
import { AccommodationHomeScreen } from '../screens/accommodation/AccommodationHomeScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
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

function DashboardTabScreen() {
  const route = useRoute<RouteProp<SpaceTabParamList, 'Dashboard'>>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId, { showProfileAndMenu: true });
  return <DashboardScreen />;
}

function MembersTabScreen() {
  const route = useRoute<RouteProp<SpaceTabParamList, 'Members'>>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);
  return <MembersScreen />;
}

function MealsTabScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<SpaceTabParamList, 'Meals'>>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);
  return <ScreenPlaceholder title={t('navigation.meals')} />;
}

function PaymentsTabScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<SpaceTabParamList, 'Payments'>>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);
  return <ScreenPlaceholder title={t('navigation.payments')} />;
}

function ComplaintsTabScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<SpaceTabParamList, 'Complaints'>>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);
  return <ScreenPlaceholder title={t('navigation.complaints')} />;
}

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
        component={DashboardTabScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.dashboard') }}
      />
      <Tab.Screen
        name="Members"
        component={MembersTabScreen}
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
        component={MealsTabScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.meals') }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsTabScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.payments') }}
      />
      <Tab.Screen
        name="Complaints"
        component={ComplaintsTabScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.complaints') }}
      />
    </Tab.Navigator>
  );
}
