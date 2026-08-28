import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminAddMessScreen } from '../screens/admin/AdminAddMessScreen';
import { AdminAddPropertyScreen } from '../screens/admin/AdminAddPropertyScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminMessDetailScreen } from '../screens/admin/AdminMessDetailScreen';
import { AdminMessListScreen } from '../screens/admin/AdminMessListScreen';
import { AdminPropertyDetailScreen } from '../screens/admin/AdminPropertyDetailScreen';
import { AdminPropertyListScreen } from '../screens/admin/AdminPropertyListScreen';
import { stackHeaderOptions } from '../theme';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      <Stack.Screen name="AdminPropertyList" component={AdminPropertyListScreen} options={{ title: 'Properties' }} />
      <Stack.Screen name="AdminPropertyDetail" component={AdminPropertyDetailScreen} options={{ title: 'Property' }} />
      <Stack.Screen name="AdminAddProperty" component={AdminAddPropertyScreen} options={{ title: 'Add Property' }} />
      <Stack.Screen name="AdminMessList" component={AdminMessListScreen} options={{ title: 'Mess' }} />
      <Stack.Screen name="AdminMessDetail" component={AdminMessDetailScreen} options={{ title: 'Mess' }} />
      <Stack.Screen name="AdminAddMess" component={AdminAddMessScreen} options={{ title: 'Add Mess' }} />
    </Stack.Navigator>
  );
}
