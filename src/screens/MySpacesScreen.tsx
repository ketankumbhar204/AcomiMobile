import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Mail, Plus } from "lucide-react-native";
import { getSpaceTypeLabel, spaceTypeIconLabel } from "../api";
import type {
  MembershipRole,
  MyInvitationResponse,
  MySpaceResponse,
} from "../api/types";
import { memberApi } from "../api/memberApi";
import {
  SpaceAttentionCardStatus,
  SpaceAttentionCountBadge,
} from "../components/spaces/SpaceAttentionCardStatus";
import { GlobalAttentionCard } from "../components/spaces/GlobalAttentionCard";
import { RecentActivityCard } from "../components/spaces/RecentActivityCard";
import { SpaceStatusBadge } from "../components/spaces/SpaceStatusBadge";
import { DashboardActionRow } from "../components/dashboard/shared/DashboardActionRow";
import { DashboardSectionTitle } from "../components/dashboard/DashboardSectionTitle";
import {
  Badge,
  EmptyState,
  FAB,
  FormInput,
  ListCard,
  ProfileHeaderButton,
  SkeletonCard,
} from "../components/ui";
import { useConsumerSpacesAttention } from "../hooks/useConsumerSpacesAttention";
import { useGlobalDashboard } from "../hooks/useGlobalDashboard";
import { invalidateAccommodationQueries } from "../utils/accommodationQueryCache";
import type { MainStackParamList } from "../navigation/types";
import { useSpaceStore } from "../store/spaceStore";
import { colors, radius, spacing, typography } from "../theme";
import { formatSpaceDisplayName } from "../utils/spaceLabels";
import { isConsumerMembershipRole } from "../utils/profileCompletion";

type MySpacesNavigation = NativeStackNavigationProp<MainStackParamList, "MySpaces">;

const SEARCH_DEBOUNCE_MS = 300;

function formatRoleLabel(role: MembershipRole, t: (key: string) => string): string {
  return t(`spaces.roles.${role}`);
}

function greetingKey(hour: number): string {
  if (hour < 12) {
    return "spaces.mySpaces.greetingMorning";
  }
  if (hour < 17) {
    return "spaces.mySpaces.greetingAfternoon";
  }
  return "spaces.mySpaces.greetingEvening";
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
    () => mySpaces.some(s => s.membershipRole === "OWNER" || s.membershipRole === "MANAGER"),
    [mySpaces],
  );
  const hasConsumerSpace = useMemo(
    () => mySpaces.some(s => isConsumerMembershipRole(s.membershipRole)),
    [mySpaces],
  );

  const globalDashboard = useGlobalDashboard(hasOperatorSpace);
  const consumerAttention = useConsumerSpacesAttention(mySpaces, hasConsumerSpace);

  const pendingBySpace = useMemo(() => {
    const map = new Map<string, number>();
    for (const summary of globalDashboard.data?.spaceSummaries ?? []) {
      map.set(summary.spaceId, summary.pendingActionCount);
    }
    return map;
  }, [globalDashboard.data?.spaceSummaries]);

  const attentionSpaceCount = useMemo(() => {
    let count = 0;
    pendingBySpace.forEach(pending => {
      if (pending > 0) {
        count += 1;
      }
    });
    return count;
  }, [pendingBySpace]);

  const totalPendingCount = globalDashboard.data?.totalAttentionCount ?? 0;

  const sortedSpaces = useMemo(() => {
    return [...mySpaces].sort((a, b) => {
      const pendingA = isConsumerMembershipRole(a.membershipRole)
        ? (consumerAttention.bySpaceId[a.spaceId]?.totalCount ?? 0)
        : (pendingBySpace.get(a.spaceId) ?? 0);
      const pendingB = isConsumerMembershipRole(b.membershipRole)
        ? (consumerAttention.bySpaceId[b.spaceId]?.totalCount ?? 0)
        : (pendingBySpace.get(b.spaceId) ?? 0);
      if (pendingA > 0 !== pendingB > 0) {
        return pendingA > 0 ? -1 : 1;
      }
      if (pendingA !== pendingB) {
        return pendingB - pendingA;
      }
      return formatSpaceDisplayName(a).localeCompare(formatSpaceDisplayName(b));
    });
  }, [consumerAttention.bySpaceId, mySpaces, pendingBySpace]);

  const loadMyInvitations = useCallback(async () => {
    try {
      setMyInvitations(await memberApi.getMyInvitations());
    } catch {
      setMyInvitations([]);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("navigation.mySpaces"),
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
      hasConsumerSpace ? consumerAttention.reload(true) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [
    consumerAttention,
    globalDashboard,
    hasConsumerSpace,
    hasOperatorSpace,
    loadMyInvitations,
    refresh,
  ]);

  const openSpace = async (space: MySpaceResponse) => {
    const success = await switchSpace(space.spaceId);
    if (success) {
      invalidateAccommodationQueries();
      navigation.navigate("SpaceTabs", {
        spaceId: space.spaceId,
        screen: "Dashboard",
        params: { spaceId: space.spaceId },
      });
    }
  };

  const buildSubtitle = (space: MySpaceResponse) => {
    const typeLabel = getSpaceTypeLabel(space.spaceType);
    const roleLabel = formatRoleLabel(space.membershipRole, t);
    return `${typeLabel} · ${roleLabel}`;
  };

  const isSearching = search.trim().length > 0;
  const showLoading = (loading || searching) && mySpaces.length === 0;
  const showGlobalOverview = hasOperatorSpace && !isSearching;
  // Join-invitation banner is for consumers joining a space — not for owners/managers.
  const showInviteBanner = myInvitations.length > 0 && !hasOperatorSpace;
  const greeting = useMemo(() => t(greetingKey(new Date().getHours())), [t]);

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
        <View style={styles.hero}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.heading}>{t("spaces.mySpaces.heading")}</Text>
          <Text style={styles.subheading}>{t("spaces.mySpaces.subheading")}</Text>
        </View>

        <FormInput
          label={t("spaces.mySpaces.searchLabel")}
          placeholder={t("spaces.mySpaces.searchPlaceholder")}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {showInviteBanner ? (
          <View style={styles.inviteBanner}>
            <DashboardActionRow
              icon={Mail}
              accent={colors.primaryDark}
              title={t("membership.incoming.bannerTitle", { count: myInvitations.length })}
              subtitle={t("membership.incoming.bannerSubtitle")}
              badgeCount={myInvitations.length}
              onPress={() => navigation.navigate("AcceptInvitations")}
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
            ) : globalDashboard.error && !globalDashboard.data ? (
              <EmptyState
                title={t("common.errors.generic")}
                description={t("common.errors.network")}
              />
            ) : (
              <>
                <GlobalAttentionCard
                  spaceCount={attentionSpaceCount}
                  totalCount={totalPendingCount}
                  onPress={() => navigation.navigate("GlobalAttentionList")}
                />
                <RecentActivityCard
                  items={globalDashboard.data?.recentActivity ?? []}
                  onPress={() => navigation.navigate("GlobalActivityList")}
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
                ? t("spaces.mySpaces.searchEmptyTitle")
                : t("spaces.mySpaces.emptyTitle")
            }
            description={
              isSearching
                ? t("spaces.mySpaces.searchEmptyDescription")
                : t("spaces.mySpaces.emptyDescription")
            }
            icon="🏠"
          />
        ) : (
          <View style={styles.list}>
            <DashboardSectionTitle title={t("spaces.mySpaces.spacesSection")} />
            {sortedSpaces.map(space => {
              const isConsumer = isConsumerMembershipRole(space.membershipRole);
              const consumerSummary = consumerAttention.bySpaceId[space.spaceId];
              const operatorPending = pendingBySpace.get(space.spaceId) ?? 0;

              return (
                <View key={space.spaceId} style={styles.listItem}>
                  {space.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Badge label={t("spaces.mySpaces.defaultBadge")} />
                    </View>
                  ) : null}
                  <ListCard
                    title={formatSpaceDisplayName(space)}
                    subtitle={buildSubtitle(space)}
                    iconLabel={spaceTypeIconLabel(space.spaceType)}
                    status={
                      isConsumer ? (
                        <SpaceAttentionCardStatus
                          summary={consumerSummary}
                          loading={consumerAttention.loading && !consumerSummary}
                        />
                      ) : operatorPending > 0 ? (
                        <SpaceStatusBadge pendingActionCount={operatorPending} />
                      ) : undefined
                    }
                    trailingBadge={
                      isConsumer ? (
                        <SpaceAttentionCountBadge count={consumerSummary?.totalCount ?? 0} />
                      ) : undefined
                    }
                    onPress={() => openSpace(space)}
                  />
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.quickSection}>
          <DashboardSectionTitle title={t("spaces.mySpaces.quickActionsTitle")} />
          <DashboardActionRow
            icon={Plus}
            accent={colors.primaryDark}
            title={t("spaces.mySpaces.addSpace")}
            subtitle={t("spaces.mySpaces.addSpaceSubtitle")}
            onPress={() => navigation.navigate("CreateSpace")}
          />
        </View>
      </ScrollView>

      <FAB
        onPress={() => navigation.navigate("CreateSpace")}
        accessibilityLabel={t("spaces.mySpaces.createFab")}
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
  hero: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  greeting: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
    marginBottom: spacing.xxs,
  },
  heading: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  subheading: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.primaryDark,
    marginBottom: spacing.lg,
  },
  inviteBanner: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  globalSection: {
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  listItem: {
    gap: spacing.xs,
  },
  defaultBadge: {
    marginBottom: spacing.xs,
  },
  skeletonGap: {
    height: spacing.md,
  },
  quickSection: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
});
