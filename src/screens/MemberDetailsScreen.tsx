import React, { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  MemberDepositTab,
  MemberDetailTabBar,
  type MemberDetailTab,
  MemberDocumentsTab,
  MemberHistoryTab,
  MemberNotesTab,
  MemberProfileTab,
  MemberStatusBadge,
  RoleBadge,
} from '../components/member';
import { Badge, HeaderBackButton, Screen, SkeletonCard } from '../components/ui';
import { useSpacePermissions } from '../hooks/useSpacePermissions';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
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
  const memberLoading = useMemberStore(state => state.memberLoading);
  const error = useMemberStore(state => state.error);

  const [activeTab, setActiveTab] = useState<MemberDetailTab>('profile');

  const spaceType = permissions.spaceType;
  const canEdit = permissions.canManageMembers && member?.role !== 'OWNER';
  const canRemove = permissions.canRemoveMember && member?.role !== 'OWNER';

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
    }, [loadMemberDetails, memberId, spaceId]),
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
            currentRole={permissions.membershipRole}
          />
        );
      case 'deposit':
        return <MemberDepositTab member={member} canEdit={canEdit} />;
      case 'documents':
        return <MemberDocumentsTab memberId={member.memberId} canEdit={canEdit} />;
      case 'notes':
        return <MemberNotesTab memberId={member.memberId} canEdit={canEdit} />;
      case 'history':
        return <MemberHistoryTab memberId={member.memberId} />;
      default:
        return null;
    }
  };

  if (memberLoading && !member) {
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {member ? (
        <>
          <Text style={styles.eyebrow}>{t('membership.details.eyebrow')}</Text>
          <Text style={styles.heading}>{member.fullName}</Text>
          <View style={styles.badgeRow}>
            <RoleBadge role={member.role} />
            <MemberStatusBadge status={member.status} />
            <Badge
              label={
                member.linkedUser
                  ? t('membership.members.appUser')
                  : t('membership.members.notUsingApp')
              }
            />
          </View>

          <MemberDetailTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          {renderTabContent()}
        </>
      ) : (
        <Text style={styles.errorText}>{t('membership.errors.loadDetails')}</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.section,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
  },
});
