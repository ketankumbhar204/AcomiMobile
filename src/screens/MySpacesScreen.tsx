import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { formatSpaceType, spaceTypeIconLabel } from '../api';
import type {
  GlobalActivityItem,
  GlobalAttentionSpace,
  MembershipRole,
  MyInvitationResponse,
  MySpaceResponse,
} from '../api/types';
import { memberApi } from '../api/memberApi';
import { GlobalAttentionCard } from '../components/spaces/GlobalAttentionCard';
import { RecentActivityCard } from '../components/spaces/RecentActivityCard';
import { SpaceStatusBadge } from '../components/spaces/SpaceStatusBadge';
import {
  Badge,
  EmptyState,
  FAB,
  FormInput,
  ListCard,
  ModuleActionCard,
  ProfileHeaderButton,
  SkeletonCard,
} from '../components/ui';
import { useGlobalDashboard } from '../hooks/useGlobalDashboard';
import { openSpaceToPendingActions, resetToDashboard } from '../navigation/navigationRef';
import { invalidateAccommodationQueries } from '../utils/accommodationQueryCache';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';
import { formatSpaceDisplayName } from '../utils/spaceLabels';

type MySpacesNavigation = NativeStackNavigationProp<MainStackParamList, 'MySpaces'>;

const SEARCH_DEBOUNCE_MS = 300;

function formatRoleLabel(role: MembershipRole, t: (key: string) => string): string {
  return t(`spaces.roles.${role}`);
}

export function MySpacesScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<MySpacesNavigation>();
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const loading = useSpaceStore(state => state.loading);
  const searching = useSpaceStore(state => state.searching);
  const error = useSpaceStore(state => state.error);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);
  const searchSpaces = useSpaceStore(state => state.searchSpaces);
  const searchQuery = useSpaceStore(state => state.searchQuery);
  const setSearchQuery = useSpaceStore(state => state.setSearchQuery);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const refresh = useSpaceStore(state => state.refresh);

  const [search, setSearch] = useState(searchQuery);
  const [refreshing, setRefreshing] = useState(false);
  const [myInvitations, setMyInvitations] = useState<MyInvitationResponse[]>([]);

  const hasOperatorSpace = useMemo(
    () => mySpaces.some(s => s.membershipRole === 'OWNER' || s.membershipRole === 'MANAGER'),
    [mySpaces],
  );

  const globalDashboard = useGlobalDashboard(hasOperatorSpace);
  const pendingBySpace = useMemo(() => {
    const map = new Map<string, number>();
    for (const summary of globalDashboard.data?.spaceSummaries ?? []) {
      map.set(summary.spaceId, summary.pendingActionCount);
    }
    return map;
  }, [globalDashboard.data?.spaceSummaries]);

  const loadMyInvitations = useCallback(async () => {
    try {
      setMyInvitations(await memberApi.getMyInvitations());
    } catch {
      setMyInvitations([]);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.mySpaces'),
      headerRight: () => <ProfileHeaderButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      if (searchQuery.trim()) {
        searchSpaces(searchQuery);
      } else {
        loadMySpaces();
      }
      void loadMyInvitations();
    }, [loadMyInvitations, loadMySpaces, searchQuery, searchSpaces]),
  );

  useEffect(() => {
    if (hasOperatorSpace && !search.trim()) {
      void globalDashboard.reload(true);
    }
  }, [globalDashboard.reload, hasOperatorSpace, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
      searchSpaces(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, searchSpaces, setSearchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refresh(),
      loadMyInvitations(),
      hasOperatorSpace ? globalDashboard.reload(true) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [globalDashboard, hasOperatorSpace, loadMyInvitations, refresh]);

  const openSpace = async (space: MySpaceResponse) => {
    const success = await switchSpace(space.spaceId);
    if (success) {
      invalidateAccommodationQueries();
      resetToDashboard(space.spaceId);
    }
  };

  const openAttentionSpace = async (space: GlobalAttentionSpace) => {
    const success = await switchSpace(space.spaceId);
    if (success) {
      invalidateAccommodationQueries();
      openSpaceToPendingActions(space.spaceId);
    }
  };

  const openActivityItem = async (item: GlobalActivityItem) => {
    const success = await switchSpace(item.spaceId);
    if (success) {
      invalidateAccommodationQueries();
      resetToDashboard(item.spaceId);
    }
  };

  const buildSubtitle = (space: MySpaceResponse) => {
    const typeLabel = formatSpaceType(space.spaceType);
    const roleLabel = formatRoleLabel(space.membershipRole, t);
    return `${typeLabel} · ${roleLabel}`;
  };

  const isSearching = search.trim().length > 0;
  const showLoading = (loading || searching) && mySpaces.length === 0;
  const showGlobalOverview = hasOperatorSpace && !isSearching;

  return (
    <View style={styles.root}>
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
        <View style={styles.heroAccent} />
        <Text style={styles.eyebrow}>{t('spaces.mySpaces.eyebrow')}</Text>
        <Text style={styles.heading}>{t('spaces.mySpaces.heading')}</Text>
        <Text style={styles.subheading}>{t('spaces.mySpaces.subheading')}</Text>

        <FormInput
          label={t('spaces.mySpaces.searchLabel')}
          placeholder={t('spaces.mySpaces.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {myInvitations.length > 0 ? (
          <View style={styles.inviteBanner}>
            <ModuleActionCard
              icon="✉️"
              title={t('membership.incoming.bannerTitle', { count: myInvitations.length })}
              subtitle={t('membership.incoming.bannerSubtitle')}
              onPress={() => navigation.navigate('AcceptInvitations')}
            />
          </View>
        ) : null}

        {showGlobalOverview ? (
          <View style={styles.globalSection}>
            {globalDashboard.loading && !globalDashboard.data ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <GlobalAttentionCard
                  spaces={globalDashboard.data?.attentionRequired ?? []}
                  totalCount={globalDashboard.data?.totalAttentionCount ?? 0}
                  onPressSpace={openAttentionSpace}
                  onViewAll={() => navigation.navigate('GlobalAttentionList')}
                />
                <RecentActivityCard
                  items={globalDashboard.data?.recentActivity ?? []}
                  onPressItem={openActivityItem}
                  onViewAll={() => navigation.navigate('GlobalActivityList')}
                />
              </>
            )}
          </View>
        ) : null}

        {showLoading ? (
          <>
            <SkeletonCard />
            <View style={styles.skeletonGap} />
            <SkeletonCard />
          </>
        ) : mySpaces.length === 0 ? (
          <EmptyState
            title={
              isSearching
                ? t('spaces.mySpaces.searchEmptyTitle')
                : t('spaces.mySpaces.emptyTitle')
            }
            description={
              isSearching
                ? t('spaces.mySpaces.searchEmptyDescription')
                : t('spaces.mySpaces.emptyDescription')
            }
            icon="🏠"
          />
        ) : (
          <View style={styles.list}>
            {mySpaces.map(space => {
              const pending = pendingBySpace.get(space.spaceId) ?? 0;
              return (
                <View key={space.spaceId} style={styles.listItem}>
                  {space.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Badge label={t('spaces.mySpaces.defaultBadge')} />
                    </View>
                  ) : null}
                  <ListCard
                    title={formatSpaceDisplayName(space)}
                    subtitle={buildSubtitle(space)}
                    iconLabel={spaceTypeIconLabel(space.spaceType)}
                    onPress={() => openSpace(space)}
                  />
                  {pending > 0 ? (
                    <View style={styles.statusWrap}>
                      <SpaceStatusBadge pendingActionCount={pending} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <FAB
        onPress={() => navigation.navigate('CreateSpace')}
        accessibilityLabel={t('spaces.mySpaces.createFab')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: 96,
  },
  heroAccent: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${colors.primary}1A`,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    color: colors.primaryDark,
    marginBottom: spacing.lg,
  },
  inviteBanner: {
    marginBottom: spacing.lg,
  },
  globalSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  listItem: {
    gap: spacing.xs,
  },
  statusWrap: {
    marginTop: -spacing.xs,
    marginLeft: spacing.sm,
  },
  defaultBadge: {
    marginBottom: spacing.xs,
  },
  skeletonGap: {
    height: spacing.md,
  },
});
