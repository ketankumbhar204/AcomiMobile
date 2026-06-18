import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MemberResponse, MembershipRole, PendingInvitationResponse } from '../api/types';
import { MemberListCard } from '../components/member/MemberListCard';
import { MemberStatusBadge, RoleBadge } from '../components/member';
import {
  MemberListMealAccessToggle,
} from '../components/meals/MemberListMealAccessRow';
import {
  Badge,
  Button,
  EmptyState,
  FAB,
  ListCard,
  SkeletonCard,
  useConfirmDialog,
} from '../components/ui';
import { useActiveSpaceId } from '../hooks/useActiveSpaceId';
import { useMealParticipationMap } from '../hooks/useMealParticipationMap';
import { useSpacePermissions } from '../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../navigation/types';
import { useAccommodationActionSheetStore } from '../store/accommodationActionSheetStore';
import { useMemberStore } from '../store/memberStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { memberCountInBadgeLabel } from '../utils/memberAppStatus';

type MembersNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Members'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type MembersRoute = NativeStackScreenProps<
  Record<'Members', { spaceId: string }>,
  'Members'
>['route'];

type MembersTab = 'members' | 'pending';

function formatRoleLabel(
  role: MembershipRole,
  t: (key: string) => string,
): string {
  return t(`spaces.roles.${role}`);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

const ROLE_SORT_ORDER: Record<MembershipRole, number> = {
  OWNER: 0,
  MANAGER: 1,
  STAFF: 2,
  TENANT: 3,
  CUSTOMER: 4,
};

function sortMembersByRole(members: MemberResponse[]): MemberResponse[] {
  return [...members].sort((a, b) => {
    const roleDiff = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
    if (roleDiff !== 0) {
      return roleDiff;
    }
    return a.fullName.localeCompare(b.fullName);
  });
}

function buildMemberSubtitle(
  member: MemberResponse,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  return formatRoleLabel(member.role, t);
}

export function MembersScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<MembersNavigation>();
  const route = useRoute<MembersRoute>();
  const spaceId = useActiveSpaceId(route.params?.spaceId);

  const members = useMemberStore(state => state.members);
  const pendingInvitations = useMemberStore(state => state.pendingInvitations);
  const loading = useMemberStore(state => state.loading);
  const refreshing = useMemberStore(state => state.refreshing);
  const error = useMemberStore(state => state.error);
  const loadMembers = useMemberStore(state => state.loadMembers);
  const loadPendingInvitations = useMemberStore(state => state.loadPendingInvitations);
  const refresh = useMemberStore(state => state.refresh);
  const cancelInvitation = useMemberStore(state => state.cancelInvitation);
  const { showConfirm } = useConfirmDialog();
  const openActionSheet = useAccommodationActionSheetStore(state => state.open);

  const [activeTab, setActiveTab] = useState<MembersTab>('members');

  const permissions = useSpacePermissions(spaceId);
  const showMealAccess = permissions.canViewMeals === true;
  const canManageMeals = permissions.canManageMeals === true;
  const isMess = permissions.spaceType === 'MESS';
  const { participationByMemberId, reloadParticipations } = useMealParticipationMap(
    spaceId,
    showMealAccess,
  );

  const sortedMembers = useMemo(() => sortMembersByRole(members), [members]);

  const showAddFab = permissions.canManageMembers;
  const showInviteAction = permissions.canManageMembers;
  const showCancelInvitation = permissions.canManageMembers;

  const inviteHeaderAction = useMemo(
    () =>
      showInviteAction ? (
        <Pressable
          onPress={() => navigation.navigate('InviteMembers', { spaceId })}
          style={({ pressed }) => [
            styles.inviteButton,
            pressed && styles.inviteButtonPressed,
          ]}
          hitSlop={8}
          accessibilityLabel={t('membership.invite.headerAction')}>
          <Text style={styles.inviteButtonText}>
            {t('membership.invite.headerAction')}
          </Text>
        </Pressable>
      ) : undefined,
    [navigation, showInviteAction, spaceId, t],
  );

  useSpaceTabHeader(spaceId, {
    headerRightExtra: inviteHeaderAction,
  });

  const openMemberFabMenu = useCallback(() => {
    openActionSheet(t('membership.add.fabMenuTitle'), [
      {
        label: t('membership.add.fabAddRecord'),
        action: () => navigation.navigate('AddMember', { spaceId }),
      },
      {
        label: t('membership.add.fabInviteApp'),
        action: () => navigation.navigate('InviteMembers', { spaceId }),
      },
    ]);
  }, [navigation, openActionSheet, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      console.log('[MembersScreen] focused', spaceId);
      loadMembers();
      loadPendingInvitations();
      void reloadParticipations();
    }, [loadMembers, loadPendingInvitations, reloadParticipations, spaceId]),
  );

  const onRefresh = useCallback(async () => {
    console.log('[MembersScreen] pull to refresh');
    await refresh();
    await reloadParticipations();
  }, [refresh, reloadParticipations]);

  const openMemberDetails = (member: MemberResponse) => {
    console.log('[MembersScreen] open member details', member.memberId);
    navigation.navigate('MemberDetails', {
      spaceId,
      memberId: member.memberId,
    });
  };

  const confirmCancelInvitation = (invitation: PendingInvitationResponse) => {
    showConfirm({
      title: t('membership.cancel.title'),
      message: t('membership.cancel.message'),
      confirmLabel: t('membership.cancel.confirm'),
      destructive: true,
      onConfirm: async () => {
        console.log('[MembersScreen] cancel invitation', invitation.invitationId);
        await cancelInvitation(invitation.invitationId);
      },
    });
  };

  const showLoading =
    loading && !refreshing && members.length === 0 && pendingInvitations.length === 0;

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab('members')}
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}>
          <Text style={[styles.tabLabel, activeTab === 'members' && styles.tabLabelActive]}>
            {t('membership.tabs.members')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}>
          <Text style={[styles.tabLabel, activeTab === 'pending' && styles.tabLabelActive]}>
            {t('membership.tabs.pending')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {activeTab === 'members' ? (
          showLoading ? (
            <>
              <SkeletonCard />
              <View style={styles.gap} />
              <SkeletonCard />
            </>
          ) : sortedMembers.length === 0 ? (
            <EmptyState
              title={t('membership.members.emptyTitle')}
              description={t('membership.members.emptyDescription')}
              icon="👥"
            />
          ) : (
            <View style={styles.list}>
              {sortedMembers.map(member => {
                const participation = participationByMemberId.get(member.memberId);
                const showMealColumn =
                  showMealAccess &&
                  ((isMess && member.role === 'CUSTOMER') ||
                    (!isMess && member.role === 'TENANT'));

                return (
                  <View key={member.memberId} style={styles.listItem}>
                    <View style={styles.badgeRow}>
                      <RoleBadge role={member.role} />
                      <MemberStatusBadge status={member.status ?? 'ACTIVE'} />
                      <Badge label={memberCountInBadgeLabel(member, t)} />
                    </View>
                    {showMealColumn ? (
                      <MemberListCard
                        title={member.fullName}
                        subtitle={buildMemberSubtitle(member, t)}
                        iconLabel={member.fullName.charAt(0).toUpperCase()}
                        onPress={() => openMemberDetails(member)}
                        trailing={
                          <MemberListMealAccessToggle
                            spaceId={spaceId}
                            memberId={member.memberId}
                            participation={participation}
                            canManage={canManageMeals}
                            onParticipationChanged={() => void reloadParticipations()}
                            labelKey={
                              isMess ? 'meals.mealAccess.label' : 'meals.foodIncluded.label'
                            }
                          />
                        }
                      />
                    ) : (
                      <ListCard
                        title={member.fullName}
                        subtitle={buildMemberSubtitle(member, t)}
                        iconLabel={member.fullName.charAt(0).toUpperCase()}
                        onPress={() => openMemberDetails(member)}
                      />
                    )}
                    <Text style={styles.createdMeta}>
                      {t('membership.members.created', {
                        date: formatDate(member.createdAt),
                      })}
                    </Text>
                  </View>
                );
              })}
            </View>
          )
        ) : showLoading ? (
          <>
            <SkeletonCard />
            <View style={styles.gap} />
            <SkeletonCard />
          </>
        ) : pendingInvitations.length === 0 ? (
          <EmptyState
            title={t('membership.pending.emptyTitle')}
            description={t('membership.pending.emptyDescription')}
            icon="✉️"
          />
        ) : (
          <View style={styles.list}>
            {pendingInvitations.map(invitation => (
              <View key={invitation.invitationId} style={styles.card}>
                <Text style={styles.cardTitle}>{invitation.mobileNumber}</Text>
                <Text style={styles.cardMeta}>
                  {formatRoleLabel(invitation.role, t)}
                </Text>
                <Text style={styles.cardMeta}>
                  {t('membership.pending.invitedBy', { name: invitation.invitedBy })}
                </Text>
                <Text style={styles.cardMeta}>
                  {t('membership.pending.created', {
                    date: formatDate(invitation.createdAt),
                  })}
                </Text>

                {showCancelInvitation ? (
                  <Button
                    label={t('membership.pending.cancel')}
                    variant="ghost"
                    onPress={() => confirmCancelInvitation(invitation)}
                    style={styles.actionButton}
                  />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showAddFab ? (
        <FAB
          onPress={
            showInviteAction ? openMemberFabMenu : () => navigation.navigate('AddMember', { spaceId })
          }
          accessibilityLabel={t('membership.add.fab')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tabLabel: {
    ...typography.body,
    color: colors.muted,
  },
  tabLabelActive: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 96,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  listItem: {
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  createdMeta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: -spacing.xs,
    marginLeft: spacing.xs,
  },
  gap: {
    height: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  inviteButton: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  inviteButtonPressed: {
    backgroundColor: colors.surface,
  },
  inviteButtonText: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.primaryDark,
  },
});
