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
import { AcceptInvitationsScreen } from '../screens/AcceptInvitationsScreen';
import { CompleteProfileScreen } from '../screens/onboarding/CompleteProfileScreen';
import { JoinSpaceScreen } from '../screens/JoinSpaceScreen';
import { OnboardingChoiceScreen } from '../screens/OnboardingChoiceScreen';
import { AddMemberScreen } from '../screens/AddMemberScreen';
import { CreateSpaceScreen } from '../screens/CreateSpaceScreen';
import { EditMemberScreen } from '../screens/EditMemberScreen';
import { MemberSubscriptionScreen } from '../screens/MemberSubscriptionScreen';
import { MemberSubscriptionHistoryScreen } from '../screens/MemberSubscriptionHistoryScreen';
import { EditSpaceScreen } from '../screens/EditSpaceScreen';
import { InviteMemberScreen } from '../screens/InviteMemberScreen';
import { MemberDetailsScreen } from '../screens/MemberDetailsScreen';
import { MemberOccupancyHistoryScreen } from '../screens/MemberOccupancyHistoryScreen';
import { MySpacesScreen } from '../screens/MySpacesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SpaceDetailsScreen } from '../screens/SpaceDetailsScreen';
import { MenuPlanningScreen } from '../screens/meals/MenuPlanningScreen';
import { MealDeliveryLocationsScreen } from '../screens/meals/MealDeliveryLocationsScreen';
import { MenuSharePreviewScreen } from '../screens/meals/MenuSharePreviewScreen';
import { MealPollResponseScreen } from '../screens/meals/MealPollResponseScreen';
import { MenuLibraryScreen } from '../screens/meals/MenuLibraryScreen';
import { DailyMenuTodayScreen } from '../screens/meals/DailyMenuTodayScreen';
import { DailyMenuEditScreen } from '../screens/meals/DailyMenuEditScreen';
import { DailyMenuSelectComboScreen } from '../screens/meals/DailyMenuSelectComboScreen';
import { SelectMenuHubScreen } from '../screens/meals/SelectMenuHubScreen';
import { MealComboFormScreen } from '../screens/meals/MealComboFormScreen';
import { SubscriptionPlansScreen } from '../screens/meals/SubscriptionPlansScreen';
import { CustomerSubscriptionPlansScreen } from '../screens/meals/CustomerSubscriptionPlansScreen';
import { SubscriptionActivationRequestsScreen } from '../screens/meals/SubscriptionActivationRequestsScreen';
import { DashboardPendingActionsScreen } from '../screens/dashboard/DashboardPendingActionsScreen';
import { DashboardBedInventoryScreen } from '../screens/dashboard/DashboardBedInventoryScreen';
import { DashboardOccupancyListScreen } from '../screens/dashboard/DashboardOccupancyListScreen';
import { MemberPaymentsScreen } from '../screens/payments/MemberPaymentsScreen';
import { PaymentReviewScreen } from '../screens/payments/PaymentReviewScreen';
import { PaymentDetailScreen } from '../screens/payments/PaymentDetailScreen';
import { PaymentHistoryScreen } from '../screens/payments/PaymentHistoryScreen';
import { SpaceNotificationsScreen } from '../screens/notifications/SpaceNotificationsScreen';
import { RaiseComplaintScreen } from '../screens/complaints/RaiseComplaintScreen';
import { ComplaintDetailScreen } from '../screens/complaints/ComplaintDetailScreen';
import { GlobalAttentionListScreen } from '../screens/spaces/GlobalAttentionListScreen';
import { GlobalActivityListScreen } from '../screens/spaces/GlobalActivityListScreen';
import { stackHeaderOptions } from '../theme';
import { useSpaceStore } from '../store/spaceStore';
import { useProfileCompletionGate } from '../hooks/useProfileCompletionGate';
import { SpaceTabNavigator } from './SpaceTabNavigator';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  const startupRoute = useSpaceStore(state => state.startupRoute);
  const selectedSpaceId = useSpaceStore(state => state.selectedSpaceId);
  const { blocked: profileBlocked } = useProfileCompletionGate();

  const initialRouteName = useMemo((): keyof MainStackParamList => {
    if (profileBlocked) {
      return 'CompleteProfile';
    }
    if (startupRoute === 'OnboardingChoice') {
      return 'OnboardingChoice';
    }
    if (startupRoute === 'JoinSpace') {
      return 'JoinSpace';
    }
    if (startupRoute === 'CreateSpace') {
      return 'CreateSpace';
    }
    if (startupRoute === 'AcceptInvitations') {
      return 'AcceptInvitations';
    }
    if (startupRoute === 'MySpaces') {
      return 'MySpaces';
    }
    if (selectedSpaceId) {
      return 'SpaceTabs';
    }
    return 'MySpaces';
  }, [profileBlocked, selectedSpaceId, startupRoute]);

  if (profileBlocked) {
    return (
      <Stack.Navigator
        initialRouteName="CompleteProfile"
        screenOptions={stackHeaderOptions}>
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfileScreen}
          options={{ title: 'Complete Profile', headerBackVisible: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="AcceptInvitations"
        component={AcceptInvitationsScreen}
        options={{ title: 'Join Space' }}
      />
      <Stack.Screen
        name="OnboardingChoice"
        component={OnboardingChoiceScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen name="JoinSpace" component={JoinSpaceScreen} />
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
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{ title: 'Edit Profile' }}
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
        name="MemberSubscription"
        component={MemberSubscriptionScreen}
        options={{ title: 'Subscription' }}
      />
      <Stack.Screen
        name="MemberSubscriptionHistory"
        component={MemberSubscriptionHistoryScreen}
        options={{ title: 'Subscription history' }}
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
        getId={({ params }) =>
          `${params.spaceId}-${params.menuDate}-${params.mealType}`
        }
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
        getId={({ params }) =>
          `${params.spaceId}-${params.menuDate}-${params.mealType}`
        }
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
        name="SelectMenuHub"
        getId={({ params }) =>
          `${params.spaceId}-${params.menuDate}-${params.mealType}`
        }
        options={{ title: 'Select Menu' }}
        children={({ route }) => (
          <SelectMenuHubScreen
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
        name="MealDeliveryLocations"
        options={{ title: 'Delivery locations' }}
        children={({ route }) => (
          <MealDeliveryLocationsScreen spaceId={route.params.spaceId} />
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
        name="MealPollResponse"
        options={{
          title: 'Meal choices',
          presentation: 'modal',
        }}
        children={({ route }) => (
          <MealPollResponseScreen
            spaceId={route.params.spaceId}
            menuDate={route.params.menuDate}
          />
        )}
      />
      <Stack.Screen
        name="SubscriptionPlans"
        options={{ title: 'Subscription Plans' }}
        children={({ route }) => <SubscriptionPlansScreen spaceId={route.params.spaceId} />}
      />
      <Stack.Screen
        name="CustomerSubscriptionPlans"
        options={{ title: 'Subscription Plans' }}
        children={({ route }) => (
          <CustomerSubscriptionPlansScreen
            spaceId={route.params.spaceId}
            memberId={route.params.memberId}
          />
        )}
      />
      <Stack.Screen
        name="DashboardPendingActions"
        options={{ title: 'Pending actions' }}
        children={({ route }) => (
          <DashboardPendingActionsScreen spaceId={route.params.spaceId} />
        )}
      />
      <Stack.Screen
        name="DashboardOccupancyList"
        options={{ title: 'Residents' }}
        component={DashboardOccupancyListScreen}
      />
      <Stack.Screen
        name="DashboardBedInventory"
        options={{ title: 'Beds' }}
        component={DashboardBedInventoryScreen}
      />
      <Stack.Screen
        name="SubscriptionActivationRequests"
        options={{ title: 'Activation Requests' }}
        children={({ route }) => (
          <SubscriptionActivationRequestsScreen spaceId={route.params.spaceId} />
        )}
      />
      <Stack.Screen name="MemberPayments" component={MemberPaymentsScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <Stack.Screen name="PaymentReview" component={PaymentReviewScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="SpaceNotifications" component={SpaceNotificationsScreen} />
      <Stack.Screen name="RaiseComplaint" component={RaiseComplaintScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <Stack.Screen name="GlobalAttentionList" component={GlobalAttentionListScreen} />
      <Stack.Screen name="GlobalActivityList" component={GlobalActivityListScreen} />
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
