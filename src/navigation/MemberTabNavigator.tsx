import React, { useEffect, useMemo, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Building2, Home, Search, UserRound } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { FindAPlaceScreen } from '../screens/FindAPlaceScreen';
import { MemberHomeScreen } from '../screens/MemberHomeScreen';
import { MySpacesScreen } from '../screens/MySpacesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useSpaceStore } from '../store/spaceStore';
import { colors, tabBarOptions, tabHeaderOptions } from '../theme';
import { getAccountIntent } from '../utils/accountIntent';
import type { MemberTabParamList } from './types';
import { SpaceTabBarLabel } from './SpaceTabBarIcon';

const Tab = createBottomTabNavigator<MemberTabParamList>();

const TAB_ICONS: Record<keyof MemberTabParamList, LucideIcon> = {
  Home: Home,
  FindAPlace: Search,
  Profile: UserRound,
};

function MemberLandingScreen() {
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const [ownerIntent, setOwnerIntent] = useState(false);
  const [intentReady, setIntentReady] = useState(mySpaces.length > 0);

  useEffect(() => {
    if (mySpaces.length > 0) {
      setIntentReady(true);
      return;
    }
    let active = true;
    void getAccountIntent().then(intent => {
      if (active) {
        setOwnerIntent(intent === 'owner');
        setIntentReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [mySpaces.length]);

  if (!intentReady) {
    return null;
  }

  if (mySpaces.length > 0 || ownerIntent) {
    return <MySpacesScreen />;
  }
  return <MemberHomeScreen />;
}

function renderMemberTabIcon(
  routeName: keyof MemberTabParamList,
  props: { color: string; focused: boolean },
  hasSpaces: boolean,
) {
  const Icon =
    routeName === 'Home' && hasSpaces ? Building2 : TAB_ICONS[routeName] ?? Home;

  return (
    <Icon
      size={24}
      color={props.color}
      strokeWidth={props.focused ? 2.4 : 2}
    />
  );
}

/**
 * Zero-space: Home · Find a place · Profile
 * With spaces: My Spaces (same Home tab) · Find a place · Profile
 */
export function MemberTabNavigator() {
  const { t } = useTranslation();
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const hasSpaces = mySpaces.length > 0;

  const homeLabel = useMemo(
    () =>
      hasSpaces
        ? t('navigation.mySpaces')
        : t('navigation.home', { defaultValue: 'Home' }),
    [hasSpaces, t],
  );

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => {
        const routeName = route.name as keyof MemberTabParamList;
        return {
          ...tabHeaderOptions,
          ...tabBarOptions,
          headerBackVisible: false,
          tabBarIcon: ({ color, focused }) =>
            renderMemberTabIcon(routeName, { color, focused }, hasSpaces),
          tabBarIconStyle: {
            width: 28,
            height: 28,
          },
        };
      }}>
      <Tab.Screen
        name="Home"
        component={MemberLandingScreen}
        options={{
          title: homeLabel,
          headerShown: true,
          tabBarLabel: ({ focused, color }) => (
            <SpaceTabBarLabel label={homeLabel} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FindAPlace"
        component={FindAPlaceScreen}
        options={{
          title: t('navigation.findAPlace'),
          tabBarLabel: ({ focused, color }) => (
            <SpaceTabBarLabel
              label={t('navigation.findAPlace')}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile'),
          tabBarLabel: ({ focused, color }) => (
            <SpaceTabBarLabel
              label={t('navigation.profile')}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
