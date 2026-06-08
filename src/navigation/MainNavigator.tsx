import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MySpacesScreen } from '../screens/MySpacesScreen';
import { stackHeaderOptions } from '../theme';
import { SpaceTabNavigator } from './SpaceTabNavigator';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="MySpaces"
        component={MySpacesScreen}
        options={{
          title: 'My Spaces',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="SpaceTabs"
        options={{ headerShown: false }}
        children={({ route }) => (
          <SpaceTabNavigator spaceId={route.params.spaceId} />
        )}
      />
    </Stack.Navigator>
  );
}
