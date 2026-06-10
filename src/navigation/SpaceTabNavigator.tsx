import React, { useLayoutEffect } from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { formatSpaceType } from '../api';
import { HeaderBackButton } from '../components/ui';
import { MembersScreen } from '../screens/MembersScreen';
import { useSpaceStore } from '../store/spaceStore';
import { colors, tabBarOptions, tabHeaderOptions, typography } from '../theme';
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
  Rooms: 'navigation.rooms',
  Meals: 'navigation.meals',
  Payments: 'navigation.payments',
  Complaints: 'navigation.complaints',
};

function createTabScreen(routeName: TabRouteName) {
  return function TabScreen() {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation();
    const title = t(TAB_TITLE_KEYS[routeName]);

    useLayoutEffect(() => {
      navigation.setOptions({
        title,
        headerBackVisible: false,
        headerLeft: () => <HeaderBackButton />,
      });
    }, [navigation, title, t, i18n.language]);

    return <ScreenPlaceholder title={title} />;
  };
}

function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const selectedSpace = useSpaceStore(state => state.selectedSpace);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () =>
        selectedSpace ? (
          <View>
            <Text style={dashboardHeaderStyles.title}>{selectedSpace.name}</Text>
            <Text style={dashboardHeaderStyles.subtitle}>
              {formatSpaceType(selectedSpace.type)}
            </Text>
          </View>
        ) : (
          <Text style={dashboardHeaderStyles.title}>{t('navigation.dashboard')}</Text>
        ),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, selectedSpace, t, i18n.language]);

  return <ScreenPlaceholder title={t('navigation.dashboard')} />;
}

const dashboardHeaderStyles = {
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
};

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
  const { t, i18n } = useTranslation();

  return (
    <Tab.Navigator key={i18n.language} screenOptions={tabScreenOptions}>
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
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.rooms') }}
      />
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
