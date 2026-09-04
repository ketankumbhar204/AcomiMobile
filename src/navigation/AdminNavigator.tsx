import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AdminAddMessScreen } from '../screens/admin/AdminAddMessScreen';
import { AdminAddPropertyScreen } from '../screens/admin/AdminAddPropertyScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminMessDetailScreen } from '../screens/admin/AdminMessDetailScreen';
import { AdminMessListScreen } from '../screens/admin/AdminMessListScreen';
import { AdminPropertyDetailScreen } from '../screens/admin/AdminPropertyDetailScreen';
import { AdminPropertyListScreen } from '../screens/admin/AdminPropertyListScreen';
import { AdminRegisteredUsersScreen } from '../screens/admin/AdminRegisteredUsersScreen';
import { AdminSavedAddressesScreen } from '../screens/admin/AdminSavedAddressesScreen';
import { stackHeaderOptions } from '../theme';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: t('admin.nav.dashboard') }}
      />
      <Stack.Screen
        name="AdminPropertyList"
        component={AdminPropertyListScreen}
        options={{ title: t('admin.nav.properties') }}
      />
      <Stack.Screen
        name="AdminPropertyDetail"
        component={AdminPropertyDetailScreen}
        options={{ title: t('admin.nav.property') }}
      />
      <Stack.Screen
        name="AdminAddProperty"
        component={AdminAddPropertyScreen}
        options={{ title: t('admin.nav.addProperty') }}
      />
      <Stack.Screen
        name="AdminMessList"
        component={AdminMessListScreen}
        options={{ title: t('admin.nav.mess') }}
      />
      <Stack.Screen
        name="AdminMessDetail"
        component={AdminMessDetailScreen}
        options={{ title: t('admin.nav.mess') }}
      />
      <Stack.Screen
        name="AdminAddMess"
        component={AdminAddMessScreen}
        options={{ title: t('admin.nav.addMess') }}
      />
      <Stack.Screen
        name="AdminRegisteredUsers"
        component={AdminRegisteredUsersScreen}
        options={{ title: t('admin.nav.users') }}
      />
      <Stack.Screen
        name="AdminSavedAddresses"
        component={AdminSavedAddressesScreen}
        options={{ title: t('admin.nav.addresses') }}
      />
    </Stack.Navigator>
  );
}
