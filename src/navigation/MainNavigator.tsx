import React, { useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { AddCustomersHubScreen } from '../screens/AddCustomersHubScreen';
import { ImportExistingPeopleScreen } from '../screens/ImportExistingPeopleScreen';
import { CreateSpaceScreen } from '../screens/CreateSpaceScreen';
import { EditMemberScreen } from '../screens/EditMemberScreen';
import { MemberSubscriptionScreen } from '../screens/MemberSubscriptionScreen';
import { MemberSubscriptionHistoryScreen } from '../screens/MemberSubscriptionHistoryScreen';
import { EditSpaceScreen } from '../screens/EditSpaceScreen';
import { InviteMemberScreen } from '../screens/InviteMemberScreen';
import { MemberDetailsScreen } from '../screens/MemberDetailsScreen';
import { MemberOccupancyHistoryScreen } from '../screens/MemberOccupancyHistoryScreen';
import { FindAPlaceDetailScreen } from '../screens/FindAPlaceDetailScreen';
import { MyEnquiriesScreen } from '../screens/MyEnquiriesScreen';
import { AccountNotificationsScreen } from '../screens/AccountNotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DeleteAccountScreen } from '../screens/auth/DeleteAccountScreen';
import { ChangeMobileScreen } from '../screens/auth/ChangeMobileScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
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
import { DashboardSpaceHealthScreen } from '../screens/dashboard/DashboardSpaceHealthScreen';
import { MemberPaymentsScreen } from '../screens/payments/MemberPaymentsScreen';
import { PaymentReviewScreen } from '../screens/payments/PaymentReviewScreen';
import { PaymentDetailScreen } from '../screens/payments/PaymentDetailScreen';
import { DayMealBulkPayScreen } from '../screens/payments/DayMealBulkPayScreen';
import { DayMealPaymentDetailScreen } from '../screens/payments/DayMealPaymentDetailScreen';
import { PaymentHistoryScreen } from '../screens/payments/PaymentHistoryScreen';
import { SpaceNotificationsScreen } from '../screens/notifications/SpaceNotificationsScreen';
import { RaiseComplaintScreen } from '../screens/complaints/RaiseComplaintScreen';
import { ComplaintDetailScreen } from '../screens/complaints/ComplaintDetailScreen';
import { GlobalAttentionListScreen } from '../screens/spaces/GlobalAttentionListScreen';
import { GlobalActivityListScreen } from '../screens/spaces/GlobalActivityListScreen';
import { InventoryDashboardScreen } from '../screens/inventory/InventoryDashboardScreen';
import { InventoryItemsScreen } from '../screens/inventory/InventoryItemsScreen';
import { InventoryItemDetailsScreen } from '../screens/inventory/InventoryItemDetailsScreen';
import { InventoryItemFormScreen } from '../screens/inventory/InventoryItemFormScreen';
import { InquiryCreditsScreen } from '../screens/InquiryCreditsScreen';
import { CapabilityStackGate } from '../components/ui/CapabilityStackGate';
import { stackHeaderOptions } from '../theme';
import { useTranslation } from 'react-i18next';
import { useSpaceStore } from '../store/spaceStore';
import { useProfileCompletionGate } from '../hooks/useProfileCompletionGate';
import { SpaceTabNavigator } from './SpaceTabNavigator';
import { MemberTabNavigator } from './MemberTabNavigator';
import { MemberTabsRedirect } from './MemberTabsRedirect';
import type { MainStackParamList } from './types';
import type { CapabilityId } from '../spaceLifecycle';

const Stack = createNativeStackNavigator<MainStackParamList>();

function SpaceTabsScreen({
  route,
}: NativeStackScreenProps<MainStackParamList, 'SpaceTabs'>) {
  // Soft navigate after space switch can leave SpaceTabs route params stale.
  // currentSpace is the source of truth (same pattern as useActiveSpaceId).
  const currentSpaceId = useSpaceStore(state => state.currentSpace?.spaceId);
  const spaceId = currentSpaceId ?? route.params.spaceId;
  return <SpaceTabNavigator key={spaceId} spaceId={spaceId} />;
}

function MemberHomeRedirect() {
  return <MemberTabsRedirect screen="Home" />;
}

function MySpacesRedirect() {
  return <MemberTabsRedirect screen="Home" />;
}

function FindAPlaceRedirect() {
  return <MemberTabsRedirect screen="FindAPlace" />;
}

/** Progressive Guided Access — stack/deep-link gate (central; screens stay unaware). */
function GatedStackScreen({
  spaceId,
  capabilityId,
  featureTitle,
  children,
}: {
  spaceId: string;
  capabilityId: CapabilityId;
  featureTitle: string;
  children: React.ReactNode;
}) {
  return (
    <CapabilityStackGate
      spaceId={spaceId}
      capabilityId={capabilityId}
      featureTitle={featureTitle}
    >
      {children}
    </CapabilityStackGate>
  );
}

function AddMemberGated({
  route,
}: NativeStackScreenProps<MainStackParamList, 'AddMember'>) {
  const { t } = useTranslation();
  return (
    <GatedStackScreen
      spaceId={route.params.spaceId}
      capabilityId="MEMBERS"
      featureTitle={t('navigation.addMember')}
    >
      <AddMemberScreen />
    </GatedStackScreen>
  );
}

function AddCustomersHubGated({
  route,
}: NativeStackScreenProps<MainStackParamList, 'AddCustomersHub'>) {
  const { t } = useTranslation();
  return (
    <GatedStackScreen
      spaceId={route.params.spaceId}
      capabilityId="MEMBERS"
      featureTitle={t('navigation.addCustomers')}
    >
      <AddCustomersHubScreen />
    </GatedStackScreen>
  );
}

function OccupancyWizardGated({
  route,
  navigation,
}: NativeStackScreenProps<MainStackParamList, 'OccupancyWizard'>) {
  const { t } = useTranslation();
  return (
    <GatedStackScreen
      spaceId={route.params.spaceId}
      capabilityId="ALLOCATION"
      featureTitle={t('navigation.occupancy')}
    >
      <OccupancyWizardScreen navigation={navigation} route={route} />
    </GatedStackScreen>
  );
}

export function MainNavigator() {
  const { t } = useTranslation();
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
    if (
      startupRoute === 'AcceptInvitations' ||
      startupRoute === 'JoinSpace' ||
      startupRoute === 'MemberHome' ||
      startupRoute === 'MySpaces'
    ) {
      return 'MemberTabs';
    }
    if (startupRoute === 'CreateSpace') {
      return 'CreateSpace';
    }
    if (selectedSpaceId) {
      return 'SpaceTabs';
    }
    return 'MemberTabs';
  }, [profileBlocked, selectedSpaceId, startupRoute]);

  if (profileBlocked) {
    return (
      <Stack.Navigator
        initialRouteName="CompleteProfile"
        screenOptions={stackHeaderOptions}>
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfileScreen}
          options={{ title: t('navigation.completeProfile'), headerBackVisible: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: t('navigation.profile') }}
        />
        <Stack.Screen
          name="DeleteAccount"
          component={DeleteAccountScreen}
          options={{ title: t('navigation.deleteAccount') }}
        />
        <Stack.Screen
          name="DeleteAccountOtp"
          component={OtpScreen}
          options={{ title: t('navigation.verifyOtp') }}
        />
        <Stack.Screen
          name="ChangeMobile"
          component={ChangeMobileScreen}
          options={{ title: t('navigation.changeMobile') }}
        />
        <Stack.Screen
          name="ChangeMobileOtp"
          component={OtpScreen}
          options={{ title: t('navigation.verifyOtp') }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="MemberTabs"
        component={MemberTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AcceptInvitations"
        component={AcceptInvitationsScreen}
        options={{ title: t('navigation.acceptInvitations') }}
      />
      <Stack.Screen
        name="OnboardingChoice"
        component={OnboardingChoiceScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="MemberHome"
        component={MemberHomeRedirect}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JoinSpace"
        component={JoinSpaceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MySpaces"
        component={MySpacesRedirect}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FindAPlace"
        component={FindAPlaceRedirect}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FindAPlaceDetail"
        component={FindAPlaceDetailScreen}
        options={{ title: t('navigation.findAPlaceDetail') }}
      />
      <Stack.Screen
        name="MyEnquiries"
        component={MyEnquiriesScreen}
        options={{ title: t('navigation.myEnquiries') }}
      />
      <Stack.Screen
        name="AccountNotifications"
        component={AccountNotificationsScreen}
        options={{ title: t('notifications.title') }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('navigation.profile') }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{ title: t('navigation.deleteAccount') }}
      />
      <Stack.Screen
        name="DeleteAccountOtp"
        component={OtpScreen}
        options={{ title: t('navigation.verifyOtp') }}
      />
      <Stack.Screen
        name="ChangeMobile"
        component={ChangeMobileScreen}
        options={{ title: t('navigation.changeMobile') }}
      />
      <Stack.Screen
        name="ChangeMobileOtp"
        component={OtpScreen}
        options={{ title: t('navigation.verifyOtp') }}
      />
      <Stack.Screen
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{ title: t('navigation.editProfile') }}
      />
      <Stack.Screen
        name="CreateSpace"
        component={CreateSpaceScreen}
        options={{ title: t('navigation.createSpace') }}
      />
      <Stack.Screen
        name="SpaceDetails"
        component={SpaceDetailsScreen}
        options={{ title: t('navigation.spaceDetails') }}
      />
      <Stack.Screen
        name="EditSpace"
        component={EditSpaceScreen}
        options={{ title: t('navigation.editSpace') }}
      />
      <Stack.Screen
        name="InviteMembers"
        component={InviteMemberScreen}
        options={{ title: t('navigation.inviteMember') }}
      />
      <Stack.Screen
        name="AddMember"
        component={AddMemberGated}
        options={{ title: t('navigation.addMember') }}
      />
      <Stack.Screen
        name="AddCustomersHub"
        component={AddCustomersHubGated}
        options={{ title: t('navigation.addCustomers') }}
      />
      <Stack.Screen
        name="ImportExistingPeople"
        component={ImportExistingPeopleScreen}
        options={{ title: t('navigation.importExistingPeople') }}
      />
      <Stack.Screen
        name="MemberDetails"
        component={MemberDetailsScreen}
        options={{ title: t('navigation.memberDetails') }}
      />
      <Stack.Screen
        name="EditMember"
        component={EditMemberScreen}
        options={{ title: t('navigation.editMember') }}
      />
      <Stack.Screen
        name="MemberSubscription"
        component={MemberSubscriptionScreen}
        options={{ title: t('navigation.subscription') }}
      />
      <Stack.Screen
        name="MemberSubscriptionHistory"
        component={MemberSubscriptionHistoryScreen}
        options={{ title: t('navigation.subscriptionHistory') }}
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
        component={OccupancyWizardGated}
        options={{ title: t('navigation.occupancy') }}
      />
      <Stack.Screen
        name="MenuLibrary"
        options={{ title: t('navigation.moreMenu.menuLibrary') }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_CONFIG"
            featureTitle={t('navigation.moreMenu.menuLibrary')}
          >
            <MenuLibraryScreen
              spaceId={route.params.spaceId}
              initialTab={route.params.initialTab}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="DailyMenuToday"
        options={{ title: t('navigation.todayMenu') }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_OPS"
            featureTitle={t('navigation.todayMenu')}
          >
            <DailyMenuTodayScreen
              spaceId={route.params.spaceId}
              menuDate={route.params.menuDate}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="DailyMenuEdit"
        getId={({ params }) =>
          `${params.spaceId}-${params.menuDate}-${params.mealType}`
        }
        options={{ title: t('navigation.planMenu') }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_OPS"
            featureTitle={t('navigation.planMenu')}
          >
            <DailyMenuEditScreen
              spaceId={route.params.spaceId}
              menuDate={route.params.menuDate}
              mealType={route.params.mealType}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="DailyMenuSelectCombo"
        getId={({ params }) =>
          `${params.spaceId}-${params.menuDate}-${params.mealType}`
        }
        options={{ title: t('navigation.selectCombo') }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_OPS"
            featureTitle={t('navigation.selectCombo')}
          >
            <DailyMenuSelectComboScreen
              spaceId={route.params.spaceId}
              menuDate={route.params.menuDate}
              mealType={route.params.mealType}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="SelectMenuHub"
        getId={({ params }) =>
          `${params.spaceId}-${params.menuDate}-${params.mealType}`
        }
        options={{ title: t('navigation.selectMenu') }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_OPS"
            featureTitle={t('navigation.selectMenu')}
          >
            <SelectMenuHubScreen
              spaceId={route.params.spaceId}
              menuDate={route.params.menuDate}
              mealType={route.params.mealType}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="MealComboForm"
        options={({ route }) => ({
          title: route.params.mode === 'edit' ? t('navigation.editCombo') : t('navigation.addCombo'),
        })}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_CONFIG"
            featureTitle={
              route.params.mode === 'edit'
                ? t('navigation.editCombo')
                : t('navigation.addCombo')
            }
          >
            <MealComboFormScreen />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="MenuPlanning"
        options={{ title: t('navigation.menuPlanning') }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_OPS"
            featureTitle={t('navigation.menuPlanning')}
          >
            <MenuPlanningScreen
              spaceId={route.params.spaceId}
              initialDate={route.params.menuDate}
              initialMealType={route.params.mealType}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="MealDeliveryLocations"
        options={{ title: t('navigation.deliveryLocations') }}
        children={({ route }) => (
          <MealDeliveryLocationsScreen spaceId={route.params.spaceId} />
        )}
      />
      <Stack.Screen
        name="MenuSharePreview"
        options={{ title: t('navigation.sharePreview') }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_OPS"
            featureTitle={t('navigation.sharePreview')}
          >
            <MenuSharePreviewScreen
              spaceId={route.params.spaceId}
              menuDate={route.params.menuDate}
              mealType={route.params.mealType}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="MealPollResponse"
        options={{
          title: t('navigation.mealChoices'),
          presentation: 'modal',
        }}
        children={({ route }) => (
          <GatedStackScreen
            spaceId={route.params.spaceId}
            capabilityId="MEAL_OPS"
            featureTitle={t('navigation.mealChoices')}
          >
            <MealPollResponseScreen
              spaceId={route.params.spaceId}
              menuDate={route.params.menuDate}
            />
          </GatedStackScreen>
        )}
      />
      <Stack.Screen
        name="SubscriptionPlans"
        options={{ title: t('navigation.mealSubscriptionPlan') }}
        children={({ route }) => <SubscriptionPlansScreen spaceId={route.params.spaceId} />}
      />
      <Stack.Screen
        name="CustomerSubscriptionPlans"
        options={{ title: t('navigation.mealSubscriptionPlan') }}
        children={({ route }) => (
          <CustomerSubscriptionPlansScreen
            spaceId={route.params.spaceId}
            memberId={route.params.memberId}
          />
        )}
      />
      <Stack.Screen
        name="DashboardPendingActions"
        options={{ title: t('navigation.pendingActions') }}
        children={({ route }) => (
          <DashboardPendingActionsScreen spaceId={route.params.spaceId} />
        )}
      />
      <Stack.Screen
        name="DashboardSpaceHealth"
        options={{ title: t('navigation.spaceHealth') }}
        component={DashboardSpaceHealthScreen}
      />
      <Stack.Screen
        name="DashboardOccupancyList"
        options={{ title: t('navigation.residents') }}
        component={DashboardOccupancyListScreen}
      />
      <Stack.Screen
        name="DashboardBedInventory"
        options={{ title: t('navigation.beds') }}
        component={DashboardBedInventoryScreen}
      />
      <Stack.Screen
        name="SubscriptionActivationRequests"
        options={{ title: t('navigation.activationRequests') }}
        children={({ route }) => (
          <SubscriptionActivationRequestsScreen spaceId={route.params.spaceId} />
        )}
      />
      <Stack.Screen name="MemberPayments" component={MemberPaymentsScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <Stack.Screen
        name="DayMealPaymentDetail"
        component={DayMealPaymentDetailScreen}
        options={{ title: t('navigation.payment') }}
      />
      <Stack.Screen
        name="DayMealBulkPay"
        component={DayMealBulkPayScreen}
        options={{ title: t('navigation.pay') }}
      />
      <Stack.Screen
        name="PaymentReview"
        component={PaymentReviewScreen}
        options={{ title: t('paymentCollection.review.tabPendingReviewLabel') }}
      />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="SpaceNotifications" component={SpaceNotificationsScreen} />
      <Stack.Screen name="RaiseComplaint" component={RaiseComplaintScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <Stack.Screen name="GlobalAttentionList" component={GlobalAttentionListScreen} />
      <Stack.Screen name="GlobalActivityList" component={GlobalActivityListScreen} />
      <Stack.Screen name="InventoryDashboard" component={InventoryDashboardScreen} />
      <Stack.Screen name="InventoryItems" component={InventoryItemsScreen} />
      <Stack.Screen name="InventoryItemDetails" component={InventoryItemDetailsScreen} />
      <Stack.Screen name="InventoryItemForm" component={InventoryItemFormScreen} />
      <Stack.Screen
        name="InquiryCredits"
        component={InquiryCreditsScreen}
        options={{ title: t('inquiryCredits.title', { defaultValue: 'Inquiry Credits' }) }}
      />
      <Stack.Screen
        name="SpaceTabs"
        component={SpaceTabsScreen}
        options={{ headerShown: false }}
        initialParams={
          selectedSpaceId ? { spaceId: selectedSpaceId } : undefined
        }
      />
    </Stack.Navigator>
  );
}
