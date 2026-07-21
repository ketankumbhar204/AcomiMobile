import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { MealBillingType, UUID } from '../../api/types';
import { MemberMealActivitySection } from '../../components/meals/MemberMealActivitySection';
import { Screen } from '../../components/ui/Screen';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useMemberMealActivityDaySheetStore } from '../../store/memberMealActivityDaySheetStore';
import { spacing } from '../../theme';
import { todayIsoDate } from '../../utils/mealDates';
import { DailyMenuTodayScreen } from './DailyMenuTodayScreen';
import { MenuPlanningScreen } from './MenuPlanningScreen';

type MealsHomeScreenProps = {
  spaceId: UUID;
};

function resolveCustomerBillingType(
  prepaidBilling: boolean | undefined,
  mealBillingType: MealBillingType | undefined,
): MealBillingType | undefined {
  if (mealBillingType) {
    return mealBillingType;
  }
  if (prepaidBilling) {
    return 'PREPAID_BALANCE';
  }
  return 'PAY_PER_MEAL';
}

export function MealsHomeScreen({ spaceId }: MealsHomeScreenProps) {
  const permissions = useSpacePermissions(spaceId);
  const role = permissions.membershipRole;
  const isCustomerOrTenant = role === 'TENANT' || role === 'CUSTOMER';
  const showCustomerMeals = isCustomerOrTenant && !permissions.canManageMeals;

  const { member, memberId: linkedMemberId } = useLinkedMember(
    showCustomerMeals ? spaceId : null,
  );
  const { status: subscriptionStatus } = useCustomerSubscriptionStatus(
    showCustomerMeals ? spaceId : null,
    linkedMemberId,
  );

  const activityReloadRef = useRef<(() => void) | null>(null);
  const openActivityDaySheet = useMemberMealActivityDaySheetStore(state => state.open);
  const closeActivityDaySheet = useMemberMealActivityDaySheetStore(state => state.close);
  const selectedActivityDate = useMemberMealActivityDaySheetStore(state => state.selectedDate);

  const effectiveMealBillingType = useMemo(
    () =>
      resolveCustomerBillingType(
        subscriptionStatus?.prepaidBilling,
        subscriptionStatus?.mealBillingType,
      ),
    [subscriptionStatus?.mealBillingType, subscriptionStatus?.prepaidBilling],
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        closeActivityDaySheet();
      };
    }, [closeActivityDaySheet]),
  );

  const handleSelectActivityDate = useCallback(
    (date: string) => {
      if (!linkedMemberId) {
        return;
      }
      setTimeout(() => {
        openActivityDaySheet(
          date,
          {
            spaceId,
            memberId: linkedMemberId,
            memberName: member?.fullName ?? '',
            canManage: false,
          },
          () => activityReloadRef.current?.(),
        );
      }, 100);
    },
    [linkedMemberId, member?.fullName, openActivityDaySheet, spaceId],
  );

  if (permissions.canManageMeals) {
    return <MenuPlanningScreen spaceId={spaceId} initialDate={todayIsoDate()} />;
  }

  if (isCustomerOrTenant) {
    return (
      <Screen scrollable contentStyle={styles.content}>
        {linkedMemberId ? (
          <MemberMealActivitySection
            spaceId={spaceId}
            memberId={linkedMemberId}
            effectiveMealBillingType={effectiveMealBillingType}
            canManageBalance={false}
            audience="customer"
            embedInParentScroll
            selectedDate={selectedActivityDate}
            onSelectDate={handleSelectActivityDate}
            onBindReload={reload => {
              activityReloadRef.current = reload;
            }}
          />
        ) : null}
      </Screen>
    );
  }

  return <DailyMenuTodayScreen spaceId={spaceId} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
  },
});
