import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateSpaceScreen } from '../screens/CreateSpaceScreen';
import { InviteMemberScreen } from '../screens/InviteMemberScreen';
import { MySpacesScreen } from '../screens/MySpacesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
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
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="CreateSpace"
        component={CreateSpaceScreen}
        options={{ title: 'Create Space' }}
      />
      <Stack.Screen
        name="InviteMembers"
        component={InviteMemberScreen}
        options={{ title: 'Invite Member' }}
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
