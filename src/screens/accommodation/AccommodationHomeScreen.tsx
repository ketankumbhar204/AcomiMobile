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
import { Button, EmptyState, FAB, RequireAccommodationAccess, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useBuildings } from '../../hooks/useBuildings';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { matchesSearch } from '../../utils/accommodationSearch';
import { renameBuildingName } from '../../utils/accommodationInlineRename';

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
  const showToast = useToastStore(state => state.showToast);

  const { buildings, loading, error, refresh, patchBuilding } = useBuildings(spaceId);
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
      void refresh();
    }, [refresh, spaceId]),
  );

  useEffect(() => {
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
  }, [buildingIdsKey, spaceId, summaryGeneration]);

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
    await refresh();
    setSummaryGeneration(getAccommodationInvalidationGeneration());
    setRefreshing(false);
  }, [refresh]);

  const openBuilder = (building: BuildingResponse) => {
    console.log('[AccommodationHomeScreen] open builder', building.buildingId);
    navigation.navigate('AccommodationBuilder', {
      spaceId,
      buildingId: building.buildingId,
    });
  };

  const openQuickSetup = () => {
    navigation.navigate('QuickSetupWizard', { spaceId });
  };

  const openManualBuilding = () => {
    navigation.navigate('BuildingForm', { spaceId, mode: 'create' });
  };

  const showLoading = loading && !refreshing && buildings.length === 0;
  const isEmpty = !showLoading && filteredBuildings.length === 0;

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
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

        {canManage ? (
          <View style={styles.ctaRow}>
            <Button
              label={t('accommodation.home.quickSetup')}
              onPress={openQuickSetup}
              style={styles.ctaButton}
            />
          </View>
        ) : null}

        {!isEmpty ? (
          <AccommodationSearchBar value={searchQuery} onChangeText={setSearchQuery} />
        ) : null}

        {showLoading ? (
          <>
            <SkeletonCard />
            <View style={styles.gap} />
            <SkeletonCard />
          </>
        ) : isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title={t('accommodation.home.emptyTitle')}
              description={t('accommodation.home.emptyDescription')}
              icon="🏢"
            />
            {canManage ? (
              <View style={styles.emptyActions}>
                <Button
                  label={t('accommodation.home.quickSetup')}
                  onPress={openQuickSetup}
                />
                <Button
                  label={t('accommodation.home.addBuildingManually')}
                  variant="secondary"
                  onPress={openManualBuilding}
                />
              </View>
            ) : null}
          </View>
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
                  await renameBuildingName(spaceId, building.buildingId, name, {
                    code: building.code,
                    layoutMode: building.layoutMode,
                  });
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

      {showFab && !isEmpty ? (
        <FAB
          onPress={openManualBuilding}
          accessibilityLabel={t('accommodation.home.addBuildingManually')}
        />
      ) : null}
      </View>
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
    paddingBottom: 96,
  },
  ctaRow: {
    marginBottom: spacing.lg,
  },
  ctaButton: {
    width: '100%',
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
