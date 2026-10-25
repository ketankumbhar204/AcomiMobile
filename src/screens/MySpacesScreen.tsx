import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Contact, CreditCard, Home, Mail, Plus, Search, Star } from "lucide-react-native";
import { formatSpaceType, getSpaceTypeLabel, spaceTypeIconLabel } from "../api";
import type {
  MembershipRole,
  MyInvitationResponse,
  MySpaceResponse,
} from "../api/types";
import { memberApi } from "../api/memberApi";
import { mySpacesApi, type MeListing } from "../api/mySpacesApi";
import { InvitationCard } from "../components/auth";
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
  EmptyState,
  FAB,
  FormInput,
  ListCard,
  SkeletonCard,
} from "../components/ui";
import { useAcceptInvitationFlow } from "../hooks/useAcceptInvitationFlow";
import { useConsumerSpacesAttention } from "../hooks/useConsumerSpacesAttention";
import { useGlobalDashboard } from "../hooks/useGlobalDashboard";
import { invalidateAccommodationQueries } from "../utils/accommodationQueryCache";
import type { MainStackParamList, MemberTabParamList } from "../navigation/types";
import { useSpaceStore } from "../store/spaceStore";
import { useToastStore } from "../store/toastStore";
import { colors, radius, spacing, typography } from "../theme";
import { formatSpaceDisplayName } from "../utils/spaceLabels";
import { isConsumerMembershipRole } from "../utils/profileCompletion";
import { membershipRoleLabelKey } from "../utils/memberRoles";
import { getAccountIntent } from "../utils/accountIntent";
import { canCreateSpace } from "../utils/spaceCreationAccess";
import { canOpenServiceContacts } from "../utils/serviceContactAccess";
import { sortSpacesForHome } from "../utils/sortSpacesForHome";
import { isPendingLead, showsResidentialInventory } from "../utils/listingActions";

type MySpacesNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MemberTabParamList, "Home">,
  NativeStackNavigationProp<MainStackParamList>
>;

const SEARCH_DEBOUNCE_MS = 300;

function formatRoleLabel(
  role: MembershipRole,
  spaceType: MySpaceResponse["spaceType"],
  t: (key: string) => string,
): string {
  return t(membershipRoleLabelKey(role, spaceType));
}

function formatInviteDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  const [allowCreateSpace, setAllowCreateSpace] = useState(false);
  const [ownerIntent, setOwnerIntent] = useState(false);
  const setSearchQuery = useSpaceStore(state => state.setSearchQuery);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const setAsDefault = useSpaceStore(state => state.setAsDefault);
  const refresh = useSpaceStore(state => state.refresh);

  const [search, setSearch] = useState(searchQuery);
  const [refreshing, setRefreshing] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [myInvitations, setMyInvitations] = useState<MyInvitationResponse[]>([]);
  const [pendingListings, setPendingListings] = useState<MeListing[]>([]);
  const [editingLead, setEditingLead] = useState<MeListing | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadAddress, setLeadAddress] = useState("");
  const [savingLead, setSavingLead] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const showToast = useToastStore(state => state.showToast);
  const { acceptInvitation, isSubmitting } = useAcceptInvitationFlow();

  useEffect(() => {
    void getAccountIntent().then(intent => setOwnerIntent(intent === "owner"));
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      return;
    }
    if (loading && mySpaces.length === 0) {
      return;
    }
    setAllowCreateSpace(canCreateSpace(mySpaces));
  }, [loading, mySpaces, searchQuery]);

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

  const memberPendingRows = useMemo(() => {
    const invitedSpaceIds = new Set(myInvitations.map(invitation => invitation.spaceId));
    const rows: Array<{
      key: string;
      title: string;
      subtitle: string;
      icon: typeof CreditCard;
      accent: string;
      onPress: () => void;
    }> = [];

    for (const space of mySpaces) {
      if (!isConsumerMembershipRole(space.membershipRole)) {
        continue;
      }
      const summary = consumerAttention.bySpaceId[space.spaceId];
      for (const item of summary?.items ?? []) {
        if (item.actionType === "PAYMENT_UPDATE_REQUESTED") {
          rows.push({
            key: `payment-${space.spaceId}`,
            title: t("dashboard.pendingActions.groups.PAYMENT_UPDATE_REQUESTED"),
            subtitle: item.detail?.trim() || formatSpaceDisplayName(space),
            icon: CreditCard,
            accent: "#D97706",
            onPress: () =>
              navigation.navigate("DashboardPendingActions", { spaceId: space.spaceId }),
          });
        } else if (
          item.actionType === "PENDING_INVITATION" &&
          !invitedSpaceIds.has(space.spaceId)
        ) {
          rows.push({
            key: `invite-action-${space.spaceId}`,
            title: t("dashboard.pendingActions.groups.SPACE_INVITATION", {
              defaultValue: "Space invitation",
            }),
            subtitle: item.detail?.trim() || formatSpaceDisplayName(space),
            icon: Mail,
            accent: "#2563EB",
            onPress: () => navigation.navigate("AcceptInvitations"),
          });
        }
      }
    }

    for (const invitation of myInvitations) {
      rows.push({
        key: `invite-${invitation.invitationId}`,
        title: t("dashboard.pendingActions.groups.SPACE_INVITATION", {
          defaultValue: "Space invitation",
        }),
        subtitle: invitation.spaceName,
        icon: Mail,
        accent: "#2563EB",
        onPress: () => navigation.navigate("AcceptInvitations"),
      });
    }

    return rows;
  }, [consumerAttention.bySpaceId, myInvitations, mySpaces, navigation, t]);

  const sortedSpaces = useMemo(
    () =>
      sortSpacesForHome(mySpaces, space =>
        isConsumerMembershipRole(space.membershipRole)
          ? (consumerAttention.bySpaceId[space.spaceId]?.totalCount ?? 0)
          : (pendingBySpace.get(space.spaceId) ?? 0),
      ),
    [consumerAttention.bySpaceId, mySpaces, pendingBySpace],
  );

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
      headerBackVisible: false,
      headerRight: undefined,
    });
  }, [navigation, t, i18n.language]);

  const loadPendingListings = useCallback(async () => {
    try {
      const rows = await mySpacesApi.listMyListings({ status: "PENDING" });
      setPendingListings(rows.filter(isPendingLead));
    } catch {
      setPendingListings([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (searchQuery.trim()) {
        searchSpaces(searchQuery);
      } else {
        loadMySpaces();
      }
      void loadMyInvitations();
      void loadPendingListings();
    }, [loadMyInvitations, loadMySpaces, loadPendingListings, searchQuery, searchSpaces]),
  );

  // Empty My Spaces for members is handled by MemberLandingScreen (shows MemberHome).
  // Owners with zero spaces stay on this screen to create a space.

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
      loadPendingListings(),
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
    loadPendingListings,
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

  const handleSetDefault = useCallback(
    async (space: MySpaceResponse) => {
      if (space.isDefault || settingDefaultId) {
        return;
      }
      setSettingDefaultId(space.spaceId);
      const success = await setAsDefault(space.spaceId);
      setSettingDefaultId(null);
      if (success) {
        showToast(
          t("spaces.mySpaces.setDefaultSuccess", {
            defaultValue: "Default space updated.",
          }),
        );
      } else {
        showToast(t("common.errors.generic"));
      }
    },
    [setAsDefault, settingDefaultId, showToast, t],
  );

  const handleAcceptInvitation = useCallback(
    async (invitation: MyInvitationResponse) => {
      setAcceptingId(invitation.invitationId);
      const membership = await acceptInvitation(invitation.invitationId);
      setAcceptingId(null);
      if (membership) {
        showToast(
          t("membership.incoming.success", { spaceName: membership.spaceName }),
        );
        setMyInvitations(prev =>
          prev.filter(item => item.invitationId !== invitation.invitationId),
        );
        await loadMySpaces();
      }
    },
    [acceptInvitation, loadMySpaces, showToast, t],
  );

  const buildSubtitle = (space: MySpaceResponse) => {
    const typeLabel = getSpaceTypeLabel(space.spaceType);
    const roleLabel = formatRoleLabel(space.membershipRole, space.spaceType, t);
    const ref = space.referenceCode ? ` · ${space.referenceCode}` : '';
    return `${typeLabel} · ${roleLabel}${ref}`;
  };

  const isSearching = search.trim().length > 0;
  const showLoading = (loading || searching) && mySpaces.length === 0;
  const showGlobalOverview = hasOperatorSpace && !isSearching;
  // Pending invitations stay visible for members who already have spaces.
  const showPendingInvites = myInvitations.length > 0;
  const inviteBusy = isSubmitting || acceptingId != null;
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

        {memberPendingRows.length > 0 && !isSearching ? (
          <View style={styles.memberPending}>
            <DashboardSectionTitle title={t("dashboard.quickActions.pendingActions")} />
            {memberPendingRows.map(row => (
              <DashboardActionRow
                key={row.key}
                icon={row.icon}
                accent={row.accent}
                highlight
                title={row.title}
                subtitle={row.subtitle}
                onPress={row.onPress}
              />
            ))}
          </View>
        ) : null}

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

        {showPendingInvites ? (
          <View style={styles.inviteSection}>
            <DashboardSectionTitle
              title={t("onboarding.memberHome.inviteSection")}
            />
            <Text style={styles.inviteCount}>
              {t("onboarding.memberHome.pendingCount", {
                count: myInvitations.length,
              })}
            </Text>
            {myInvitations.map(invitation => {
              const accepting = acceptingId === invitation.invitationId;
              return (
                <InvitationCard
                  key={invitation.invitationId}
                  spaceName={invitation.spaceName}
                  spaceTypeLabel={formatSpaceType(invitation.spaceType)}
                  roleLabel={t(membershipRoleLabelKey(invitation.role, invitation.spaceType))}
                  invitedBy={t("membership.incoming.invitedBy", {
                    name: invitation.invitedBy,
                  })}
                  expiresLabel={t("membership.incoming.expires", {
                    date: formatInviteDate(invitation.expiresAt),
                  })}
                  acceptLabel={
                    accepting
                      ? t("membership.incoming.accepting")
                      : t("onboarding.join.accept")
                  }
                  accepting={accepting}
                  disabled={inviteBusy}
                  onAccept={() => void handleAcceptInvitation(invitation)}
                />
              );
            })}
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

        {pendingListings.length > 0 && !isSearching ? (
          <View style={styles.list}>
            <DashboardSectionTitle
              title={t("spaces.mySpaces.pendingTitle", { defaultValue: "Pending review" })}
              subtitle={t("spaces.mySpaces.pendingHint", {
                defaultValue: "Not public until ACOMI publishes the listing.",
              })}
            />
            {pendingListings.map(listing => {
              const mess = listing.kind === "MESS" || listing.spaceType === "MESS";
              const residential = showsResidentialInventory(listing);
              return (
                <View key={listing.registrationId} style={styles.listItem}>
                  <ListCard
                    title={listing.name}
                    subtitle={[
                      mess ? "MESS" : listing.spaceType || listing.kind,
                      listing.registrationStatus || "PENDING",
                      listing.registrationReference || "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    status={
                      <Text style={styles.pendingNote}>
                        {residential
                          ? ""
                          : t("spaces.mySpaces.pendingNoInventory", {
                              defaultValue: "No rooms or beds until this listing is published.",
                            })}
                      </Text>
                    }
                    onPress={() => {
                      setEditingLead(listing);
                      setLeadName(listing.name ?? "");
                      setLeadAddress(listing.address ?? "");
                    }}
                  />
                </View>
              );
            })}
            {editingLead ? (
              <View style={styles.listItem}>
                <FormInput label={t("spaces.mySpaces.listingName", { defaultValue: "Name" })} value={leadName} onChangeText={setLeadName} />
                <FormInput
                  label={t("spaces.mySpaces.listingAddress", { defaultValue: "Address" })}
                  value={leadAddress}
                  onChangeText={setLeadAddress}
                />
                <Pressable
                  disabled={savingLead || !leadName.trim() || !editingLead.registrationId}
                  onPress={() => {
                    const registrationId = editingLead.registrationId;
                    if (!registrationId) return;
                    setSavingLead(true);
                    const request =
                      editingLead.kind === "MESS"
                        ? mySpacesApi.updateMessLead(registrationId, {
                            messName: leadName.trim(),
                            addressLine: leadAddress.trim(),
                          })
                        : mySpacesApi.updatePropertyLead(registrationId, {
                            propertyName: leadName.trim(),
                            addressLine: leadAddress.trim(),
                          });
                    void request
                      .then(async () => {
                        setEditingLead(null);
                        await loadPendingListings();
                        showToast(t("spaces.mySpaces.pendingSaved", { defaultValue: "Listing updated." }));
                      })
                      .catch(() => {
                        showToast(t("common.errors.generic"));
                      })
                      .finally(() => setSavingLead(false));
                  }}
                  style={styles.setDefaultButton}
                >
                  <Text style={styles.setDefaultLabel}>
                    {savingLead
                      ? t("spaces.mySpaces.savingListing", { defaultValue: "Saving…" })
                      : t("spaces.mySpaces.saveListing", { defaultValue: "Save listing" })}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {showLoading ? (
          <>
            <SkeletonCard />
            <View style={styles.skeletonGap} />
            <SkeletonCard />
          </>
        ) : mySpaces.length === 0 ? (
          <View style={styles.emptyBlock}>
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
              Icon={Home}
            />
            {!isSearching ? (
              <DashboardActionRow
                icon={Search}
                accent={colors.primaryDark}
                title={t("spaces.mySpaces.findPlace")}
                subtitle={t("spaces.mySpaces.findPlaceSubtitle")}
                onPress={() => navigation.navigate("FindAPlace")}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            <DashboardSectionTitle
              title={t("spaces.mySpaces.spacesSection")}
              subtitle={t("spaces.mySpaces.defaultHint", {
                defaultValue: "Your default space opens first when you launch the app.",
              })}
            />
            {sortedSpaces.map(space => {
              const isConsumer = isConsumerMembershipRole(space.membershipRole);
              const consumerSummary = consumerAttention.bySpaceId[space.spaceId];
              const operatorPending = pendingBySpace.get(space.spaceId) ?? 0;
              const isSettingDefault = settingDefaultId === space.spaceId;

              return (
                <View key={space.spaceId} style={styles.listItem}>
                  <ListCard
                    title={formatSpaceDisplayName(space)}
                    subtitle={buildSubtitle(space)}
                    iconLabel={spaceTypeIconLabel(space.spaceType)}
                    status={
                      <View style={styles.cardStatusRow}>
                        <View style={styles.cardStatusMain}>
                          {isConsumer ? (
                            <SpaceAttentionCardStatus
                              summary={consumerSummary}
                              loading={consumerAttention.loading && !consumerSummary}
                            />
                          ) : operatorPending > 0 ? (
                            <SpaceStatusBadge pendingActionCount={operatorPending} />
                          ) : null}
                        </View>
                        {space.isDefault ? (
                          <Text style={styles.defaultLabel}>
                            {t("spaces.mySpaces.defaultBadge")}
                          </Text>
                        ) : (
                          <Pressable
                            onPress={() => void handleSetDefault(space)}
                            disabled={Boolean(settingDefaultId)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.setDefaultButton,
                              pressed && styles.setDefaultButtonPressed,
                              isSettingDefault && styles.setDefaultButtonBusy,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={t("spaces.mySpaces.setDefault", {
                              defaultValue: "Set as default",
                            })}
                          >
                            <Star
                              size={14}
                              color={colors.primaryDark}
                              strokeWidth={2.2}
                              fill={isSettingDefault ? colors.primaryDark : "transparent"}
                            />
                            <Text style={styles.setDefaultLabel}>
                              {isSettingDefault
                                ? t("spaces.mySpaces.settingDefault", {
                                    defaultValue: "Updating…",
                                  })
                                : t("spaces.mySpaces.setDefault", {
                                    defaultValue: "Set as default",
                                  })}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    }
                    trailingBadge={
                      !space.isDefault && isConsumer ? (
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
            icon={Search}
            accent={colors.primaryDark}
            title={t("spaces.mySpaces.findPlace")}
            subtitle={t("spaces.mySpaces.findPlaceSubtitle")}
            onPress={() => navigation.navigate("FindAPlace")}
          />
          {allowCreateSpace ? (
            <DashboardActionRow
              icon={Plus}
              accent={colors.primaryDark}
              title={t("spaces.mySpaces.addSpace")}
              subtitle={t("spaces.mySpaces.addSpaceSubtitle")}
              onPress={() => navigation.navigate("CreateSpace")}
            />
          ) : null}
          {canOpenServiceContacts(mySpaces, ownerIntent) ? (
            <DashboardActionRow
              icon={Contact}
              accent={colors.primaryDark}
              highlight
              title={t("spaces.mySpaces.serviceContacts")}
              subtitle={t("spaces.mySpaces.serviceContactsSubtitle")}
              onPress={() => navigation.navigate("ServiceContacts")}
            />
          ) : null}
        </View>
      </ScrollView>

      {allowCreateSpace ? (
        <FAB
          onPress={() => navigation.navigate("CreateSpace")}
          accessibilityLabel={t("spaces.mySpaces.createFab")}
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
  memberPending: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  inviteSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  inviteCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
  pendingNote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardStatusMain: {
    flex: 1,
    minWidth: 0,
  },
  defaultLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
    marginLeft: "auto",
    flexShrink: 0,
  },
  setDefaultButton: {
    marginLeft: "auto",
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.button,
  },
  setDefaultButtonPressed: {
    backgroundColor: colors.lightGreen,
  },
  setDefaultButtonBusy: {
    opacity: 0.7,
  },
  setDefaultLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  skeletonGap: {
    height: spacing.md,
  },
  quickSection: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  emptyBlock: {
    gap: spacing.md,
  },
});
