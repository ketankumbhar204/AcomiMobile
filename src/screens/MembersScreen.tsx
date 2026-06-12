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
import { MemberStatusBadge } from '../components/member';
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
import { useSpaceTabHeader } from '../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import {
  canAddMember,
  canCancelInvitation,
  canInviteMember,
} from '../utils/memberPermissions';

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

  const mySpaces = useSpaceStore(state => state.mySpaces);
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

  const [activeTab, setActiveTab] = useState<MembersTab>('members');

  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );

  const showAddFab = canAddMember(currentRole);
  const showInviteAction = canInviteMember(currentRole);
  const showCancelInvitation = canCancelInvitation(currentRole);

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
    showProfileAndMenu: false,
    headerRightExtra: inviteHeaderAction,
  });

  useFocusEffect(
    useCallback(() => {
      console.log('[MembersScreen] focused', spaceId);
      loadMembers();
      loadPendingInvitations();
    }, [loadMembers, loadPendingInvitations, spaceId]),
  );

  const onRefresh = useCallback(async () => {
    console.log('[MembersScreen] pull to refresh');
    await refresh();
  }, [refresh]);

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
          ) : members.length === 0 ? (
            <EmptyState
              title={t('membership.members.emptyTitle')}
              description={t('membership.members.emptyDescription')}
              icon="👥"
            />
          ) : (
            <View style={styles.list}>
              {members.map(member => (
                <View key={member.memberId} style={styles.listItem}>
                  <View style={styles.badgeRow}>
                    <MemberStatusBadge status={member.status ?? 'ACTIVE'} />
                    <Badge
                      label={
                        member.linkedUser
                          ? t('membership.members.appUser')
                          : t('membership.members.notUsingApp')
                      }
                    />
                  </View>
                  <ListCard
                    title={member.fullName}
                    subtitle={buildMemberSubtitle(member, t)}
                    iconLabel={member.fullName.charAt(0).toUpperCase()}
                    onPress={() => openMemberDetails(member)}
                  />
                  <Text style={styles.createdMeta}>
                    {t('membership.members.created', {
                      date: formatDate(member.createdAt),
                    })}
                  </Text>
                </View>
              ))}
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
          onPress={() => navigation.navigate('AddMember', { spaceId })}
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
