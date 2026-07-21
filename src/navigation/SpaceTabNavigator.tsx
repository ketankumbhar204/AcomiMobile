import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SpaceTabBackButton } from '../components/ui';
import { NotificationBellButton } from '../components/notifications/NotificationBellButton';
import { useSpaceTabHeader } from '../hooks/useSpaceTabHeader';
import { useSpacePermissions } from '../hooks/useSpacePermissions';
import { AccommodationHomeScreen } from '../screens/accommodation/AccommodationHomeScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MembersScreen } from '../screens/MembersScreen';
import { useProfileCompletionGate } from '../hooks/useProfileCompletionGate';
import { navigateMainStack } from './mainStackNavigation';
import { colors, tabBarOptions, tabHeaderOptions } from '../theme';
import { MealsHomeScreen } from '../screens/meals/MealsHomeScreen';
import { PermissionDeniedScreen } from '../components/ui/PermissionDeniedScreen';
import { PaymentsScreen } from '../screens/payments/PaymentsScreen';
import { TenantPaymentsTabScreen } from '../screens/payments/TenantPaymentsTabScreen';
import { ComplaintsListScreen } from '../screens/complaints/ComplaintsListScreen';
import type { SpaceTabParamList } from './types';
import { canManagePayments, currentMonthKey } from '../utils/dashboardFinancial';
import { usePaymentsUnderReviewBadge } from '../hooks/usePaymentsUnderReviewBadge';
import { seedPaymentsUnderReviewFromPendingActions } from '../utils/paymentsReviewAttentionCache';
import { peekPendingActions } from '../utils/pendingActionsQueryCache';
import { peekDashboardSummary } from '../utils/dashboardQueryCache';

const Tab = createBottomTabNavigator<SpaceTabParamList>();

type SpaceTabNavigatorProps = {
  spaceId: string;
};

function DashboardTabScreen() {
  const route = useRoute<RouteProp<SpaceTabParamList, 'Dashboard'>>();
  const { spaceId } = route.params;
  // Stable element — a fresh JSX node each render retriggers setOptions forever.
  const notificationBell = useMemo(
    () => <NotificationBellButton spaceId={spaceId} />,
    [spaceId],
  );
  useSpaceTabHeader(spaceId, {
    showProfileAndMenu: true,
    headerRightExtra: notificationBell,
  });
  return <DashboardScreen />;
}

function MembersTabScreen() {
  const route = useRoute<RouteProp<SpaceTabParamList, 'Members'>>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);
  return <MembersScreen />;
}

function MealsTabScreen() {
  const route = useRoute<RouteProp<SpaceTabParamList, 'Meals'>>();
  const { spaceId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  useSpaceTabHeader(spaceId);

  if (!permissions.canViewMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return <MealsHomeScreen spaceId={spaceId} />;
}

function PaymentsTabScreen() {
  const route = useRoute<RouteProp<SpaceTabParamList, 'Payments'>>();
  const { spaceId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  const canManage = canManagePayments(permissions.membershipRole);

  if (canManage) {
    return <PaymentsScreen />;
  }

  return <TenantPaymentsTabScreen />;
}

function ComplaintsTabScreen() {
  const route = useRoute<RouteProp<SpaceTabParamList, 'Complaints'>>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);
  return <ComplaintsListScreen />;
}

const tabScreenOptions = {
  ...tabHeaderOptions,
  ...tabBarOptions,
  headerBackVisible: false as const,
  headerLeft: () => <SpaceTabBackButton />,
};

export function SpaceTabNavigator({ spaceId }: SpaceTabNavigatorProps) {
  const { t, i18n } = useTranslation();
  const permissions = useSpacePermissions(spaceId);
  const { blocked: profileBlocked } = useProfileCompletionGate();
  const canManagePay = canManagePayments(permissions.membershipRole);
  const paymentsReviewBadge = usePaymentsUnderReviewBadge(spaceId, canManagePay);

  const showAccommodation = useMemo(
    () => permissions.canViewAccommodation,
    [permissions.canViewAccommodation],
  );

  const showMembersTab = permissions.canManageMembers;

  // Seed badge from dashboard/pending-actions already in memory (no new fetch).
  useEffect(() => {
    if (!canManagePay) {
      return;
    }
    const month = currentMonthKey();
    const pending =
      peekPendingActions(spaceId, month) ??
      peekDashboardSummary(spaceId, month)?.pendingActions ??
      null;
    seedPaymentsUnderReviewFromPendingActions(spaceId, month, pending);
  }, [canManagePay, spaceId]);

  useEffect(() => {
    if (profileBlocked) {
      navigateMainStack('CompleteProfile', undefined);
    }
  }, [profileBlocked]);

  if (profileBlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Tab.Navigator
      key={`${spaceId}-${i18n.language}`}
      // Fabric + react-native-screens: remounting inactive screens causes
      // addViewAt "child already has a parent" when opening Mess (fewer tabs).
      detachInactiveScreens={false}
      screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardTabScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.dashboard') }}
      />
      {showMembersTab ? (
        <Tab.Screen
          name="Members"
          component={MembersTabScreen}
          initialParams={{ spaceId }}
          options={{ headerShown: true, title: t('navigation.members') }}
        />
      ) : null}
      {showAccommodation ? (
        <Tab.Screen
          name="Accommodation"
          component={AccommodationHomeScreen}
          initialParams={{ spaceId }}
          options={{ title: t('navigation.accommodation') }}
        />
      ) : null}
      <Tab.Screen
        name="Meals"
        component={MealsTabScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.meals') }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsTabScreen}
        initialParams={{ spaceId }}
        options={{
          title: t('navigation.payments'),
          tabBarBadge:
            canManagePay && paymentsReviewBadge > 0
              ? paymentsReviewBadge > 99
                ? '99+'
                : paymentsReviewBadge
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#DC2626',
            color: colors.white,
            fontSize: 10,
            fontWeight: '700',
            minWidth: 16,
            height: 16,
            lineHeight: 14,
          },
        }}
      />
      <Tab.Screen
        name="Complaints"
        component={ComplaintsTabScreen}
        initialParams={{ spaceId }}
        options={{ title: t('navigation.complaints') }}
      />
    </Tab.Navigator>
  );
}
