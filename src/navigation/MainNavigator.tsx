import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddMemberScreen } from '../screens/AddMemberScreen';
import { CreateSpaceScreen } from '../screens/CreateSpaceScreen';
import { EditMemberScreen } from '../screens/EditMemberScreen';
import { EditSpaceScreen } from '../screens/EditSpaceScreen';
import { InviteMemberScreen } from '../screens/InviteMemberScreen';
import { MemberDetailsScreen } from '../screens/MemberDetailsScreen';
import { MySpacesScreen } from '../screens/MySpacesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SpaceDetailsScreen } from '../screens/SpaceDetailsScreen';
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
        name="SpaceDetails"
        component={SpaceDetailsScreen}
        options={{ title: 'Space Details' }}
      />
      <Stack.Screen
        name="EditSpace"
        component={EditSpaceScreen}
        options={{ title: 'Edit Space' }}
      />
      <Stack.Screen
        name="InviteMembers"
        component={InviteMemberScreen}
        options={{ title: 'Invite Member' }}
      />
      <Stack.Screen
        name="AddMember"
        component={AddMemberScreen}
        options={{ title: 'Add Member' }}
      />
      <Stack.Screen
        name="MemberDetails"
        component={MemberDetailsScreen}
        options={{ title: 'Member Details' }}
      />
      <Stack.Screen
        name="EditMember"
        component={EditMemberScreen}
        options={{ title: 'Edit Member' }}
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
