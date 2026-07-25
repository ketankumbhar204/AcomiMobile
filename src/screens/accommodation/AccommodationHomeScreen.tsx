import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { accommodationApi } from '../../api/accommodationApi';
import { getAccommodationInvalidationGeneration, subscribeAccommodationInvalidation } from '../../utils/accommodationQueryCache';
import type { BuildingResponse, BuildingSummaryResponse, SpaceType } from '../../api/types';
import { AccommodationSearchBar, BuildingListCard } from '../../components/accommodation';
import { AccommodationHomeSpeedDial } from '../../components/accommodation/AccommodationHomeSpeedDial';
import { DashboardAccommodationOperations } from '../../components/dashboard/DashboardAccommodationOperations';
import { CoachmarkAnchor, CoachmarkSequence } from '../../components/coachmarks';
import { Button, EmptyState, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { ENABLE_SETUP_COACHMARKS } from '../../coachmarks';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useBuildings } from '../../hooks/useBuildings';
import { useDashboardAccommodationOperationsQuick } from '../../hooks/useDashboardAccommodationOperationsQuick';
import { useNavigateFromSpaceTab } from '../../hooks/useNavigateFromSpaceTab';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceLifecycle } from '../../hooks/useSpaceLifecycle';
import { useSpaceLifecycleSignals } from '../../hooks/useSpaceLifecycleSignals';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { matchesSearch } from '../../utils/accommodationSearch';
import { renameBuildingName } from '../../utils/accommodationInlineRename';
import { currentMonthKey } from '../../utils/dashboardFinancial';
import { peekDashboardSummary } from '../../utils/dashboardQueryCache';
import { peekPendingActions } from '../../utils/pendingActionsQueryCache';
import { canManageNotifications } from '../../utils/spaceOperator';
import { isAccommodationApplicable } from '../../utils/accommodationProfile';

type AccommodationNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Accommodation'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type AccommodationRoute = NativeStackScreenProps<
  SpaceTabParamList,
  'Accommodation'
>['route'];

export function AccommodationHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<AccommodationNav>();
  const route = useRoute<AccommodationRoute>();
  const spaceId = useActiveSpaceId(route.params?.spaceId);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType as SpaceType | undefined,
    [mySpaces, spaceId],
  );
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageAccommodation;
  const showFab = permissions.canManageAccommodation;
  const canViewOccupancyDrilldown =
    permissions.canManageOccupancy || permissions.canViewSpaceOccupancies === true;
  const navigateFromTab = useNavigateFromSpaceTab();
  const showToast = useToastStore(state => state.showToast);
  const showOwnerSetup =
    canManageNotifications(permissions) &&
    Boolean(spaceType) &&
    isAccommodationApplicable(spaceType);

  const pendingActionCount = spaceId
    ? peekPendingActions(spaceId)?.length ?? 0
    : 0;
  const { context: lifecycleContext } = useSpaceLifecycleSignals({
    spaceId,
    spaceType,
    permissions,
    enabled: showOwnerSetup,
    pendingActionCount,
    hasOperationalSignal: false,
  });
  const { lifecycle } = useSpaceLifecycle({
    spaceType,
    context: lifecycleContext,
    enabled: showOwnerSetup,
  });

  const [isFocused, setIsFocused] = useState(false);
  const { buildings, loading, error, refresh, patchBuilding } = useBuildings(spaceId);
  const cachedAccommodationOps = peekDashboardSummary(
    spaceId,
    currentMonthKey(),
  )?.accommodationOperations;
  const quickAccommodation = useDashboardAccommodationOperationsQuick(
    spaceId,
    Boolean(spaceId) && isFocused && cachedAccommodationOps == null,
  );
  const accommodationOperations = useMemo(() => {
    if (cachedAccommodationOps) {
      return cachedAccommodationOps;
    }
    return quickAccommodation.operations;
  }, [cachedAccommodationOps, quickAccommodation.operations]);

  useEffect(() => {
    if (!accommodationOperations) return;
    // #region agent log
    fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeScreen.tsx:accommodationOperations',message:'operations cards rendered',data:{occupied:accommodationOperations.occupiedBeds,vacant:accommodationOperations.vacantBeds,moveIns:accommodationOperations.moveInsThisMonth,canViewOccupancyDrilldown},timestamp:Date.now(),hypothesisId:'H3',runId:'accom-ui'})}).catch(()=>{});
    // #endregion
  }, [accommodationOperations, canViewOccupancyDrilldown]);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, BuildingSummaryResponse>>({});
  const [summaryGeneration, setSummaryGeneration] = useState(
    getAccommodationInvalidationGeneration(),
  );

  useEffect(() => {
    return subscribeAccommodationInvalidation(() => {
      setSummaryGeneration(getAccommodationInvalidationGeneration());
    });
  }, []);

  const buildingIdsKey = useMemo(
    () =>
      buildings
        .map(building => building.buildingId)
        .sort()
        .join('|'),
    [buildings],
  );

  useSpaceTabHeader(spaceId, { showProfileAndMenu: false });

  useFocusEffect(
    useCallback(() => {
      console.log('[AccommodationHomeScreen] focused', spaceId);
      setIsFocused(true);
      void refresh();
      return () => {
        setIsFocused(false);
      };
    }, [refresh, spaceId]),
  );

  // Per-building summaries are heavy (status COUNTs). Only fetch while this tab is focused —
  // the tab stays mounted after first visit, and invalidation must not storm the API from Dashboard.
  useEffect(() => {
    if (!isFocused) {
      return;
    }
    if (!spaceId || buildingIdsKey.length === 0) {
      setSummaries({});
      return;
    }

    const buildingIds = buildingIdsKey.split('|');
    let cancelled = false;

    void Promise.all(
      buildingIds.map(async buildingId => {
        try {
          const summary = await accommodationApi.getBuildingSummary(spaceId, buildingId);
          return [buildingId, summary] as const;
        } catch {
          return null;
        }
      }),
    ).then(results => {
      if (cancelled) {
        return;
      }
      const map: Record<string, BuildingSummaryResponse> = {};
      results.forEach(entry => {
        if (entry) {
          map[entry[0]] = entry[1];
        }
      });
      setSummaries(map);
    });

    return () => {
      cancelled = true;
    };
  }, [buildingIdsKey, isFocused, spaceId, summaryGeneration]);

  const filteredBuildings = useMemo(
    () =>
      buildings.filter(building =>
        matchesSearch(searchQuery, building.name, building.code),
      ),
    [buildings, searchQuery],
  );

  const onRefresh = useCallback(async () => {
    console.log('[AccommodationHomeScreen] pull to refresh');
    setRefreshing(true);
    await Promise.all([refresh(), quickAccommodation.reload()]);
    setSummaryGeneration(getAccommodationInvalidationGeneration());
    setRefreshing(false);
  }, [quickAccommodation, refresh]);

  const handleOccupiedBedsPress = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeScreen.tsx:handleOccupiedBedsPress',message:'occupancy card nav',data:{target:'DashboardOccupancyList',mode:'active',spaceId},timestamp:Date.now(),hypothesisId:'H1',runId:'accom-ui'})}).catch(()=>{});
    // #endregion
    navigateFromTab('DashboardOccupancyList', { spaceId, mode: 'active' });
  }, [navigateFromTab, spaceId]);

  const handleVacantBedsPress = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeScreen.tsx:handleVacantBedsPress',message:'vacant card nav',data:{target:'DashboardBedInventory',status:'AVAILABLE',spaceId},timestamp:Date.now(),hypothesisId:'H1',runId:'accom-ui'})}).catch(()=>{});
    // #endregion
    navigateFromTab('DashboardBedInventory', { spaceId, status: 'AVAILABLE' });
  }, [navigateFromTab, spaceId]);

  const handleMoveInsPress = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeScreen.tsx:handleMoveInsPress',message:'move-ins card nav',data:{target:'DashboardOccupancyList',mode:'moveInsThisMonth',spaceId},timestamp:Date.now(),hypothesisId:'H1',runId:'accom-ui'})}).catch(()=>{});
    // #endregion
    navigateFromTab('DashboardOccupancyList', { spaceId, mode: 'moveInsThisMonth' });
  }, [navigateFromTab, spaceId]);

  const openBuilder = (building: BuildingResponse) => {
    console.log('[AccommodationHomeScreen] open builder', building.buildingId);
    navigation.navigate('AccommodationBuilder', {
      spaceId,
      buildingId: building.buildingId,
    });
  };

  const openQuickSetup = () => {
    // #region agent log
    fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeScreen.tsx:openQuickSetup',message:'floating quick setup',data:{spaceId},timestamp:Date.now(),hypothesisId:'H2',runId:'accom-ui'})}).catch(()=>{});
    // #endregion
    navigation.navigate('QuickSetupWizard', { spaceId });
  };

  const openManualBuilding = () => {
    // #region agent log
    fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeScreen.tsx:openManualBuilding',message:'add manually',data:{spaceId},timestamp:Date.now(),hypothesisId:'H2',runId:'accom-ui'})}).catch(()=>{});
    // #endregion
    navigation.navigate('BuildingForm', { spaceId, mode: 'create' });
  };

  const showLoading = loading && !refreshing && buildings.length === 0;
  const isEmpty = !showLoading && filteredBuildings.length === 0;
  const hasBuildings = buildings.length > 0;
  const canOpenOccupancyDrilldown = hasBuildings && canViewOccupancyDrilldown;
  const coachmarksEnabled =
    ENABLE_SETUP_COACHMARKS &&
    showOwnerSetup &&
    isFocused &&
    isEmpty &&
    canManage;

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
      <CoachmarkSequence
        spaceId={spaceId}
        tourId="setup.accommodation.v1"
        lifecycle={lifecycle}
        enabled={coachmarksEnabled}>
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
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {accommodationOperations ? (
              <DashboardAccommodationOperations
                hideTitle
                operations={accommodationOperations}
                onOccupiedPress={
                  canOpenOccupancyDrilldown ? handleOccupiedBedsPress : undefined
                }
                onVacantPress={
                  canOpenOccupancyDrilldown ? handleVacantBedsPress : undefined
                }
                onMoveInsPress={
                  canOpenOccupancyDrilldown ? handleMoveInsPress : undefined
                }
              />
            ) : null}

            {!isEmpty ? (
              <AccommodationSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            ) : null}

            {showLoading ? (
              <>
                <SkeletonCard />
                <View style={styles.gap} />
                <SkeletonCard />
              </>
            ) : isEmpty ? (
              <CoachmarkAnchor id="propertyLayout" active={coachmarksEnabled}>
                <View style={styles.emptyWrap}>
                  <CoachmarkAnchor id="nextGuidance" active={coachmarksEnabled}>
                    <EmptyState
                      title={t('accommodation.home.emptyTitle')}
                      description={t('accommodation.home.emptyDescription')}
                      icon="🏢"
                    />
                  </CoachmarkAnchor>
                  {canManage ? (
                    <CoachmarkAnchor
                      id="continueSetup"
                      active={coachmarksEnabled}
                      style={styles.emptyActions}>
                      <Button
                        label={t('accommodation.home.quickSetup')}
                        onPress={openQuickSetup}
                      />
                      <Button
                        label={t('accommodation.home.addBuildingManually')}
                        variant="secondary"
                        onPress={openManualBuilding}
                      />
                    </CoachmarkAnchor>
                  ) : null}
                </View>
              </CoachmarkAnchor>
            ) : (
              <View style={styles.list}>
                {filteredBuildings.map(building => (
                  <BuildingListCard
                    key={building.buildingId}
                    building={building}
                    summary={summaries[building.buildingId]}
                    spaceType={spaceType}
                    editableName={canManage}
                    onSaveName={async name => {
                      await renameBuildingName(
                        spaceId,
                        building.buildingId,
                        name,
                        {
                          code: building.code,
                          layoutMode: building.layoutMode,
                        },
                      );
                      patchBuilding(building.buildingId, { name });
                      setSummaries(prev => {
                        const existing = prev[building.buildingId];
                        if (!existing) {
                          return prev;
                        }
                        return {
                          ...prev,
                          [building.buildingId]: { ...existing, name },
                        };
                      });
                      showToast(t('accommodation.buildings.updateSuccess'));
                    }}
                    onPress={() => openBuilder(building)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <AccommodationHomeSpeedDial
            visible={showFab && !isEmpty}
            onQuickSetup={openQuickSetup}
            onAddManually={openManualBuilding}
          />
        </View>
      </CoachmarkSequence>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  gap: {
    height: spacing.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
  },
  emptyActions: {
    marginTop: spacing.xl,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
