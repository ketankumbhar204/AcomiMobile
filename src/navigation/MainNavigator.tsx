import React, { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccommodationBedsScreen } from '../screens/accommodation/AccommodationBedsScreen';
import { AccommodationBuilderScreen } from '../screens/accommodation/AccommodationBuilderScreen';
import { OccupancyWizardScreen } from '../features/occupancy/OccupancyWizard';
import { AccommodationFloorApartmentsScreen } from '../screens/accommodation/AccommodationFloorApartmentsScreen';
import { AccommodationRoomsScreen } from '../screens/accommodation/AccommodationRoomsScreen';
import { QuickSetupWizardScreen } from '../screens/accommodation/QuickSetupWizardScreen';
import { BedDetailScreen } from '../screens/accommodation/BedDetailScreen';
import { BedFormScreen } from '../screens/accommodation/BedFormScreen';
import { BuildingDetailScreen } from '../screens/accommodation/BuildingDetailScreen';
import { BuildingFormScreen } from '../screens/accommodation/BuildingFormScreen';
import { FloorDetailScreen } from '../screens/accommodation/FloorDetailScreen';
import { FloorFormScreen } from '../screens/accommodation/FloorFormScreen';
import { FloorsScreen } from '../screens/accommodation/FloorsScreen';
import { RoomDetailScreen } from '../screens/accommodation/RoomDetailScreen';
import { RoomFormScreen } from '../screens/accommodation/RoomFormScreen';
import { UnitDetailScreen } from '../screens/accommodation/UnitDetailScreen';
import { UnitFormScreen } from '../screens/accommodation/UnitFormScreen';
import { UnitsScreen } from '../screens/accommodation/UnitsScreen';
import { AddMemberScreen } from '../screens/AddMemberScreen';
import { CreateSpaceScreen } from '../screens/CreateSpaceScreen';
import { EditMemberScreen } from '../screens/EditMemberScreen';
import { EditSpaceScreen } from '../screens/EditSpaceScreen';
import { InviteMemberScreen } from '../screens/InviteMemberScreen';
import { MemberDetailsScreen } from '../screens/MemberDetailsScreen';
import { MemberOccupancyHistoryScreen } from '../screens/MemberOccupancyHistoryScreen';
import { MySpacesScreen } from '../screens/MySpacesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SpaceDetailsScreen } from '../screens/SpaceDetailsScreen';
import { MenuPlanningScreen } from '../screens/meals/MenuPlanningScreen';
import { MenuSharePreviewScreen } from '../screens/meals/MenuSharePreviewScreen';
import { MenuLibraryScreen } from '../screens/meals/MenuLibraryScreen';
import { DailyMenuTodayScreen } from '../screens/meals/DailyMenuTodayScreen';
import { DailyMenuEditScreen } from '../screens/meals/DailyMenuEditScreen';
import { DailyMenuSelectComboScreen } from '../screens/meals/DailyMenuSelectComboScreen';
import { DailyMenuSelectItemsScreen } from '../screens/meals/DailyMenuSelectItemsScreen';
import { MealComboFormScreen } from '../screens/meals/MealComboFormScreen';
import { MealParticipantListScreen } from '../screens/meals/MealParticipantListScreen';
import { MealParticipationFormScreen } from '../screens/meals/MealParticipationFormScreen';
import { stackHeaderOptions } from '../theme';
import { useSpaceStore } from '../store/spaceStore';
import { SpaceTabNavigator } from './SpaceTabNavigator';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  const startupRoute = useSpaceStore(state => state.startupRoute);
  const selectedSpaceId = useSpaceStore(state => state.selectedSpaceId);

  const initialRouteName = useMemo((): keyof MainStackParamList => {
    if (startupRoute === 'CreateSpace') {
      return 'CreateSpace';
    }
    if (startupRoute === 'MySpaces') {
      return 'MySpaces';
    }
    if (selectedSpaceId) {
      return 'SpaceTabs';
    }
    return 'MySpaces';
  }, [selectedSpaceId, startupRoute]);

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={stackHeaderOptions}>
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
        name="MemberOccupancyHistory"
        component={MemberOccupancyHistoryScreen}
      />
      <Stack.Screen name="Floors" component={FloorsScreen} />
      <Stack.Screen name="Units" component={UnitsScreen} />
      <Stack.Screen
        name="AccommodationFloorApartments"
        component={AccommodationFloorApartmentsScreen}
      />
      <Stack.Screen name="AccommodationRooms" component={AccommodationRoomsScreen} />
      <Stack.Screen name="AccommodationBeds" component={AccommodationBedsScreen} />
      <Stack.Screen name="BuildingDetail" component={BuildingDetailScreen} />
      <Stack.Screen name="FloorDetail" component={FloorDetailScreen} />
      <Stack.Screen name="UnitDetail" component={UnitDetailScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="BedDetail" component={BedDetailScreen} />
      <Stack.Screen name="BuildingForm" component={BuildingFormScreen} />
      <Stack.Screen name="FloorForm" component={FloorFormScreen} />
      <Stack.Screen name="UnitForm" component={UnitFormScreen} />
      <Stack.Screen name="RoomForm" component={RoomFormScreen} />
      <Stack.Screen name="BedForm" component={BedFormScreen} />
      <Stack.Screen name="QuickSetupWizard" component={QuickSetupWizardScreen} />
      <Stack.Screen name="AccommodationBuilder" component={AccommodationBuilderScreen} />
      <Stack.Screen
        name="OccupancyWizard"
        component={OccupancyWizardScreen}
        options={{ title: 'Occupancy' }}
      />
      <Stack.Screen
        name="MenuLibrary"
        options={{ title: 'Menu Library' }}
        children={({ route }) => <MenuLibraryScreen spaceId={route.params.spaceId} />}
      />
      <Stack.Screen
        name="DailyMenuToday"
        options={{ title: "Today's Menu" }}
        children={({ route }) => (
          <DailyMenuTodayScreen spaceId={route.params.spaceId} />
        )}
      />
      <Stack.Screen
        name="DailyMenuEdit"
        options={{ title: 'Plan Menu' }}
        children={({ route }) => (
          <DailyMenuEditScreen
            spaceId={route.params.spaceId}
            menuDate={route.params.menuDate}
            mealType={route.params.mealType}
          />
        )}
      />
      <Stack.Screen
        name="DailyMenuSelectCombo"
        options={{ title: 'Select Combo' }}
        children={({ route }) => (
          <DailyMenuSelectComboScreen
            spaceId={route.params.spaceId}
            menuDate={route.params.menuDate}
            mealType={route.params.mealType}
          />
        )}
      />
      <Stack.Screen
        name="DailyMenuSelectItems"
        options={{ title: 'Select Items' }}
        children={({ route }) => (
          <DailyMenuSelectItemsScreen
            spaceId={route.params.spaceId}
            menuDate={route.params.menuDate}
            mealType={route.params.mealType}
          />
        )}
      />
      <Stack.Screen
        name="MealComboForm"
        component={MealComboFormScreen}
        options={({ route }) => ({
          title: route.params.mode === 'edit' ? 'Edit Combo' : 'Add Combo',
        })}
      />
      <Stack.Screen
        name="MealParticipantList"
        options={{ title: 'Meal Participants' }}
        children={({ route }) => (
          <MealParticipantListScreen spaceId={route.params.spaceId} />
        )}
      />
      <Stack.Screen
        name="MealParticipationForm"
        component={MealParticipationFormScreen}
        options={{ title: 'Meal Enrollment' }}
      />
      <Stack.Screen
        name="MenuPlanning"
        options={{ title: 'Menu Planning' }}
        children={({ route }) => (
          <MenuPlanningScreen
            spaceId={route.params.spaceId}
            initialDate={route.params.menuDate}
          />
        )}
      />
      <Stack.Screen
        name="MenuSharePreview"
        options={{ title: 'Share Preview' }}
        children={({ route }) => (
          <MenuSharePreviewScreen
            spaceId={route.params.spaceId}
            menuDate={route.params.menuDate}
            mealType={route.params.mealType}
          />
        )}
      />
      <Stack.Screen
        name="SpaceTabs"
        options={{ headerShown: false }}
        initialParams={
          selectedSpaceId ? { spaceId: selectedSpaceId } : undefined
        }
        children={({ route }) => (
          <SpaceTabNavigator spaceId={route.params.spaceId} />
        )}
      />
    </Stack.Navigator>
  );
}
