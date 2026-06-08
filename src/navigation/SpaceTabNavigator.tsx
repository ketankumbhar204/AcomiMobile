import React, { useLayoutEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '../components/ui';
import { tabBarOptions, tabHeaderOptions } from '../theme';
import { ScreenPlaceholder } from './ScreenPlaceholder';
import type { SpaceTabParamList } from './types';

const Tab = createBottomTabNavigator<SpaceTabParamList>();

type SpaceTabNavigatorProps = {
  spaceId: string;
};

function createTabScreen(title: string) {
  return function TabScreen() {
    const navigation = useNavigation();

    useLayoutEffect(() => {
      navigation.setOptions({
        title,
        headerBackVisible: false,
        headerLeft: () => <HeaderBackButton />,
      });
    }, [navigation, title]);

    return <ScreenPlaceholder title={title} />;
  };
}

const DashboardScreen = createTabScreen('Dashboard');
const MembersScreen = createTabScreen('Members');
const RoomsScreen = createTabScreen('Rooms');
const MealsScreen = createTabScreen('Meals');
const PaymentsScreen = createTabScreen('Payments');
const ComplaintsScreen = createTabScreen('Complaints');

const tabScreenOptions = {
  ...tabHeaderOptions,
  ...tabBarOptions,
  headerBackVisible: false as const,
  headerLeft: () => <HeaderBackButton />,
};

export function SpaceTabNavigator({ spaceId }: SpaceTabNavigatorProps) {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ spaceId }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        initialParams={{ spaceId }}
      />
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        initialParams={{ spaceId }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        initialParams={{ spaceId }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        initialParams={{ spaceId }}
      />
      <Tab.Screen
        name="Complaints"
        component={ComplaintsScreen}
        initialParams={{ spaceId }}
      />
    </Tab.Navigator>
  );
}
