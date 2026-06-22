import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  MemberCompactHeader,
  MemberDepositTab,
  MemberDetailTabBar,
  type MemberDetailTab,
  MemberHistoryTab,
  MemberProfileTab,
} from '../components/member';
import { MemberMealsTab } from '../components/meals';
import { HeaderBackButton, Screen, SkeletonCard } from '../components/ui';
import { useSpacePermissions } from '../hooks/useSpacePermissions';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useMemberMealActivityDaySheetStore } from '../store/memberMealActivityDaySheetStore';
import { spacing, typography } from '../theme';

type MemberDetailsNav = NativeStackNavigationProp<
  MainStackParamList,
  'MemberDetails'
>;
type MemberDetailsRoute = NativeStackScreenProps<
  MainStackParamList,
  'MemberDetails'
>['route'];

export function MemberDetailsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<MemberDetailsNav>();
  const route = useRoute<MemberDetailsRoute>();
  const { spaceId, memberId } = route.params;

  const permissions = useSpacePermissions(spaceId);
  const member = useMemberStore(state => state.selectedMember);
  const loadMemberDetails = useMemberStore(state => state.loadMemberDetails);
  const loadPendingInvitations = useMemberStore(state => state.loadPendingInvitations);
  const memberLoading = useMemberStore(state => state.memberLoading);
  const error = useMemberStore(state => state.error);

  const [activeTab, setActiveTab] = useState<MemberDetailTab>('profile');
  const activityReloadRef = useRef<(() => void) | null>(null);
  const openActivityDaySheet = useMemberMealActivityDaySheetStore(state => state.open);
  const closeActivityDaySheet = useMemberMealActivityDaySheetStore(state => state.close);
  const selectedActivityDate = useMemberMealActivityDaySheetStore(state => state.selectedDate);

  const spaceType = permissions.spaceType;
  const canEdit = permissions.canManageMembers && member?.role !== 'OWNER';
  const canRemove = permissions.canRemoveMember && member?.role !== 'OWNER';
  const canInvite =
    permissions.canManageMembers &&
    member?.role !== 'OWNER' &&
    member?.membershipId == null;
  const showMealsTab = permissions.canViewMeals === true;
  const canManageMeals = permissions.canManageMeals === true;
  const isMealsTab = activeTab === 'meals';

  const refreshMember = useCallback(() => {
    void loadMemberDetails(memberId);
  }, [loadMemberDetails, memberId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.memberDetails'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      console.log('[MemberDetails] screen focused', { spaceId, memberId });
      void loadMemberDetails(memberId);
      void loadPendingInvitations();
      return () => {
        closeActivityDaySheet();
      };
    }, [closeActivityDaySheet, loadMemberDetails, loadPendingInvitations, memberId, spaceId]),
  );

  const renderTabContent = () => {
    if (!member) {
      return null;
    }

    switch (activeTab) {
      case 'profile':
        return (
          <MemberProfileTab
            spaceId={spaceId}
            spaceType={spaceType}
            member={member}
            canEdit={canEdit}
            canRemove={canRemove}
            canInvite={canInvite}
            currentRole={permissions.membershipRole}
          />
        );
      case 'meals':
        return (
          <MemberMealsTab
            spaceId={spaceId}
            spaceType={spaceType}
            member={member}
            canManageBalance={canManageMeals}
            canEditMember={canEdit}
            onBillingChanged={refreshMember}
            onSelectActivityDate={date => {
              setTimeout(() => {
                openActivityDaySheet(
                  date,
                  {
                    spaceId,
                    memberId: member.memberId,
                    memberName: member.fullName,
                    canManage: canManageMeals,
                  },
                  () => activityReloadRef.current?.(),
                );
              }, 100);
            }}
            selectedActivityDate={selectedActivityDate}
            onBindActivityReload={reload => {
              activityReloadRef.current = reload;
            }}
          />
        );
      case 'deposit':
        return <MemberDepositTab member={member} canEdit={canEdit} />;
      case 'history':
        return <MemberHistoryTab memberId={member.memberId} />;
      default:
        return null;
    }
  };

  if (memberLoading && !member) {
    return (
      <Screen contentStyle={styles.contentCompact}>
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <>
      <Screen
        scrollable={!isMealsTab}
        contentStyle={[
          styles.contentCompact,
          isMealsTab && styles.contentMeals,
        ]}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {member ? (
          <>
            <MemberCompactHeader
              member={member}
              spaceId={spaceId}
              spaceType={spaceType}
              showMealAccess={isMealsTab}
              canManageMeals={canManageMeals}
              onRefreshMember={refreshMember}
            />

            <MemberDetailTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              showMealsTab={showMealsTab}
              compact
            />
            {renderTabContent()}
          </>
        ) : (
          <Text style={styles.errorText}>{t('membership.errors.loadDetails')}</Text>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  contentCompact: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  contentMeals: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
  },
});
