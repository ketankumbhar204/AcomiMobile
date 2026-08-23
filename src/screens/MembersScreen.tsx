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
import { Mail, UserPlus, Users, X } from 'lucide-react-native';
import type { MemberResponse, MembershipRole, PendingInvitationResponse } from '../api/types';
import { MemberListCard } from '../components/member/MemberListCard';
import { MemberOccupancyStatusBadge, MemberStatusBadge } from '../components/member';
import { MemberListMealAccessSwitch } from '../components/meals/MemberListMealAccessRow';
import {
  EmptyState,
  FAB,
  ListSearchFilterBar,
  SegmentedTabs,
  SkeletonCard,
  useConfirmDialog,
} from '../components/ui';
import { MembersFilterDrawer } from '../components/member/MembersFilterDrawer';
import { DashboardSectionTitle } from '../components/dashboard/DashboardSectionTitle';
import {
  DashboardRoleChip,
  type DashboardPersonRoleTone,
} from '../components/dashboard/shared/DashboardPersonCard';
import { useActiveSpaceId } from '../hooks/useActiveSpaceId';
import { useMealParticipationMap } from '../hooks/useMealParticipationMap';
import { useSpacePermissions } from '../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../navigation/types';
import { useAccommodationActionSheetStore } from '../store/accommodationActionSheetStore';
import { useMemberStore } from '../store/memberStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { memberAcomiBadgeLabel } from '../utils/memberAppStatus';
import { getMemberListFoodLabel, isReceivingMealsForMember } from '../utils/mealAccess';
import { getMemberStatusLabelKey } from '../utils/memberStatus';
import {
  countMemberListFilters,
  defaultMemberListFilters,
  filterAndSortMembers,
  filterPendingInvitations,
  memberFilterOptionCount,
  type MemberListFilterState,
} from '../utils/memberListQuery';
import { shouldUseFilterDrawer } from '../utils/filterUx';
import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { devLog } from '../utils/devLog';

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

function memberRoleTone(role: MembershipRole): DashboardPersonRoleTone {
  switch (role) {
    case 'OWNER':
      return 'owner';
    case 'MANAGER':
    case 'CUSTOMER':
      return 'customer';
    case 'TENANT':
      return 'resident';
    default:
      return 'staff';
  }
}

function buildMemberStatusChip(
  member: MemberResponse,
  showTenantOccupancyStatus: boolean,
): React.ReactNode | undefined {
  if (showTenantOccupancyStatus && member.role === 'TENANT') {
    return <MemberOccupancyStatusBadge status={member.occupancyStatus} />;
  }
  if (member.status !== 'ACTIVE') {
    return <MemberStatusBadge status={member.status} />;
  }
  return undefined;
}

export function MembersScreen() {
  const { t } = useTranslation();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilters, setListFilters] = useState<MemberListFilterState>(() =>
    defaultMemberListFilters(),
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const permissions = useSpacePermissions(spaceId);
  const showMealAccess = permissions.canViewMeals === true;
  const canManageMeals = permissions.canManageMeals === true;
  const isMess = permissions.spaceType === 'MESS';
  const showTenantOccupancyStatus =
    permissions.spaceType != null && isAccommodationApplicable(permissions.spaceType);
  const { participationByMemberId, reloadParticipations } = useMealParticipationMap(
    spaceId,
    showMealAccess,
  );

  const sortedMembers = useMemo(
    () =>
      filterAndSortMembers(members, {
        search: searchQuery,
        filters: listFilters,
        spaceType: permissions.spaceType,
      }),
    [listFilters, members, permissions.spaceType, searchQuery],
  );

  const filteredPendingInvitations = useMemo(
    () =>
      filterPendingInvitations(pendingInvitations, {
        search: searchQuery,
        roles: listFilters.roles,
        spaceType: permissions.spaceType,
      }),
    [listFilters.roles, pendingInvitations, permissions.spaceType, searchQuery],
  );

  const activeFilterCount = countMemberListFilters(listFilters, permissions.spaceType);
  const useMembersFilterDrawer = shouldUseFilterDrawer(
    memberFilterOptionCount(permissions.spaceType),
  );

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
          accessibilityRole="button"
          accessibilityLabel={t('membership.invite.headerAction')}>
          <UserPlus size={16} color={colors.primaryDark} strokeWidth={2.2} />
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
      devLog('[MembersScreen] focused', spaceId);
      loadMembers();
      loadPendingInvitations();
      void reloadParticipations();
    }, [loadMembers, loadPendingInvitations, reloadParticipations, spaceId]),
  );

  const onRefresh = useCallback(async () => {
    devLog('[MembersScreen] pull to refresh');
    await refresh();
    await reloadParticipations();
  }, [refresh, reloadParticipations]);

  const openMemberDetails = (member: MemberResponse) => {
    devLog('[MembersScreen] open member details', member.memberId);
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
        devLog('[MembersScreen] cancel invitation', invitation.invitationId);
        await cancelInvitation(invitation.invitationId);
      },
    });
  };

  const showLoading =
    loading && !refreshing && members.length === 0 && pendingInvitations.length === 0;

  return (
    <View style={styles.root}>
      <SegmentedTabs
        style={styles.tabs}
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'members', label: t('membership.tabs.members'), icon: Users },
          { key: 'pending', label: t('membership.tabs.pending'), icon: Mail },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <DashboardSectionTitle
          title={
            activeTab === 'members'
              ? t('membership.tabs.members')
              : t('membership.tabs.pending')
          }
          subtitle={
            activeTab === 'members'
              ? t('membership.members.listSubtitle')
              : t('membership.pending.listSubtitle')
          }
        />

        <ListSearchFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            activeTab === 'members'
              ? t('list.search.members')
              : t('list.search.pendingInvitations')
          }
          onFilterPress={() => setFilterDrawerOpen(true)}
          activeFilterCount={activeFilterCount}
          showFilterButton={useMembersFilterDrawer}
        />

        {activeTab === 'members' ? (
          showLoading ? (
            <>
              <SkeletonCard />
              <View style={styles.gap} />
              <SkeletonCard />
              <View style={styles.gap} />
              <SkeletonCard />
            </>
          ) : sortedMembers.length === 0 ? (
            <EmptyState
              title={
                members.length === 0
                  ? t('membership.members.emptyTitle')
                  : t('list.emptyFiltered')
              }
              description={
                members.length === 0
                  ? t('membership.members.emptyDescription')
                  : undefined
              }
              Icon={Users}
            />
          ) : (
            <View style={styles.list}>
              {sortedMembers.map(member => {
                const participation = participationByMemberId.get(member.memberId);
                const showFoodLine =
                  showMealAccess &&
                  ((isMess && member.role === 'CUSTOMER') ||
                    (!isMess && member.role === 'TENANT'));
                const receiving = isReceivingMealsForMember(participation, {
                  spaceType: permissions.spaceType,
                  occupancyStatus: member.occupancyStatus,
                });

                return (
                  <MemberListCard
                    key={member.memberId}
                    title={member.fullName}
                    iconLabel={member.fullName.charAt(0).toUpperCase()}
                    onPress={() => openMemberDetails(member)}
                    roleChip={
                      <DashboardRoleChip
                        label={formatRoleLabel(member.role, t)}
                        tone={memberRoleTone(member.role)}
                      />
                    }
                    statusChip={buildMemberStatusChip(member, showTenantOccupancyStatus)}
                    statusLabel={t(getMemberStatusLabelKey(member.status ?? 'ACTIVE'))}
                    acomiLabel={memberAcomiBadgeLabel(member, t)}
                    acomiActive={member.membershipId != null}
                    footerLine={t('membership.members.created', {
                      date: formatDate(member.createdAt),
                    })}
                    foodLine={
                      showFoodLine
                        ? {
                            label: getMemberListFoodLabel(
                              receiving,
                              permissions.spaceType,
                              t,
                            ),
                            manageControl: (
                              <MemberListMealAccessSwitch
                                spaceId={spaceId}
                                memberId={member.memberId}
                                participation={participation}
                                canManage={canManageMeals}
                                spaceType={permissions.spaceType}
                                occupancyStatus={member.occupancyStatus}
                                onParticipationChanged={() =>
                                  reloadParticipations().catch(() => undefined)
                                }
                                labelKey={
                                  isMess
                                    ? 'meals.mealAccess.label'
                                    : 'meals.foodIncluded.label'
                                }
                              />
                            ),
                          }
                        : undefined
                    }
                  />
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
            Icon={Mail}
          />
        ) : filteredPendingInvitations.length === 0 ? (
          <EmptyState title={t('list.emptyFiltered')} Icon={Mail} />
        ) : (
          <View style={styles.list}>
            {filteredPendingInvitations.map(invitation => (
              <View key={invitation.invitationId} style={styles.inviteCard}>
                <View style={styles.inviteTopRow}>
                  <View style={styles.inviteIconWrap}>
                    <Mail size={18} color="#2563EB" strokeWidth={2.2} />
                  </View>
                  <View style={styles.inviteBody}>
                    <Text style={styles.inviteTitle} numberOfLines={1}>
                      {invitation.mobileNumber}
                    </Text>
                    <View style={styles.inviteChipRow}>
                      <DashboardRoleChip
                        label={formatRoleLabel(invitation.role, t)}
                        tone={memberRoleTone(invitation.role)}
                      />
                      <Text style={styles.inviteSubtitle} numberOfLines={1}>
                        {t('membership.pending.invitedBy', { name: invitation.invitedBy })}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.inviteMetaRow}>
                  <Text style={styles.inviteMeta} numberOfLines={1}>
                    {t('membership.pending.created', {
                      date: formatDate(invitation.createdAt),
                    })}
                  </Text>
                  {showCancelInvitation ? (
                    <Pressable
                      onPress={() => confirmCancelInvitation(invitation)}
                      hitSlop={8}
                      android_ripple={{ color: 'rgba(220, 38, 38, 0.08)' }}
                      style={({ pressed }) => [
                        styles.inviteCancelButton,
                        pressed && styles.inviteCancelPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t('membership.pending.cancel')}>
                      <X size={14} color="#DC2626" strokeWidth={2.4} />
                      <Text style={styles.inviteCancel}>{t('membership.pending.cancel')}</Text>
                    </Pressable>
                  ) : null}
                </View>
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

      <MembersFilterDrawer
        visible={filterDrawerOpen}
        spaceType={permissions.spaceType}
        applied={listFilters}
        showStatusSection={activeTab === 'members'}
        showSortSection={activeTab === 'members'}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={setListFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 96,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
  },
  list: {
    gap: spacing.md,
  },
  gap: {
    height: spacing.md,
  },
  inviteCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  inviteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  inviteIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  inviteTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inviteChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inviteSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    flexShrink: 1,
  },
  inviteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  inviteMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    flex: 1,
  },
  inviteCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  inviteCancelPressed: {
    backgroundColor: '#FEE2E2',
  },
  inviteCancel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  inviteButton: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inviteButtonPressed: {
    backgroundColor: colors.surface,
  },
  inviteButtonText: {
    ...typography.bodyStrong,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});
