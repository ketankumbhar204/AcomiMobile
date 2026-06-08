import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from './colors';
import { typography } from './typography';

export const stackHeaderOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    ...typography.h3,
    fontSize: 17,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

export const tabHeaderOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    ...typography.h3,
    fontSize: 17,
  },
  headerShadowVisible: false,
};

export const tabBarOptions = {
  tabBarStyle: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
};
