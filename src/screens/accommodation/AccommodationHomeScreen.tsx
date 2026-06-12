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
import type { BuildingResponse, BuildingSummaryResponse } from '../../api/types';
import { AccommodationSearchBar } from '../../components/accommodation';
import { Button, EmptyState, FAB, ListCard, SkeletonCard } from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useBuildings } from '../../hooks/useBuildings';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import {
  canCreateOrUpdateAccommodation,
  canManageAccommodation,
} from '../../utils/accommodationPermissions';
import { getAccommodationUiProfile } from '../../utils/accommodationProfile';
import { matchesSearch } from '../../utils/accommodationSearch';
import { renameBuildingName } from '../../utils/accommodationInlineRename';
import { useToastStore } from '../../store/toastStore';

type AccommodationNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Accommodation'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type AccommodationRoute = NativeStackScreenProps<
  SpaceTabParamList,
  'Accommodation'
>['route'];

function formatBuildingSubtitle(
  summary: BuildingSummaryResponse | undefined,
  spaceType: string | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | undefined {
  if (!summary || !spaceType) {
    return undefined;
  }

  const profile = getAccommodationUiProfile(
    spaceType as Parameters<typeof getAccommodationUiProfile>[0],
    summary.layoutMode,
  );
  if (!profile) {
    return undefined;
  }

  const parts: string[] = [];
  if (profile.showBeds && summary.beds > 0) {
    parts.push(t('accommodation.home.beds', { count: summary.beds }));
  }
  if (profile.showFloors && summary.floors > 0) {
    parts.push(t('accommodation.home.floors', { count: summary.floors }));
  }
  if (profile.showUnitsOnFloor && summary.visibleUnitCount > 0) {
    parts.push(t('accommodation.home.apartments', { count: summary.visibleUnitCount }));
  } else if (profile.showUnits && summary.visibleUnitCount > 0) {
    parts.push(t('accommodation.home.units', { count: summary.visibleUnitCount }));
  }
  if (parts.length === 0 && summary.rooms > 0) {
    parts.push(t('accommodation.home.rooms', { count: summary.rooms }));
  }

  return parts.length > 0 ? parts.join(' · ') : t('accommodation.home.manageHint');
}

export function AccommodationHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<AccommodationNav>();
  const route = useRoute<AccommodationRoute>();
  const spaceId = useActiveSpaceId(route.params?.spaceId);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType,
    [mySpaces, spaceId],
  );
  const currentRole = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.membershipRole,
    [mySpaces, spaceId],
  );
  const canManage = canManageAccommodation(currentRole);
  const showFab = canCreateOrUpdateAccommodation(currentRole);
  const showToast = useToastStore(state => state.showToast);

  const { buildings, loading, error, refresh } = useBuildings(spaceId);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, BuildingSummaryResponse>>({});

  useSpaceTabHeader(spaceId, { showProfileAndMenu: false });

  useFocusEffect(
    useCallback(() => {
      console.log('[AccommodationHomeScreen] focused', spaceId);
      void refresh();
    }, [refresh, spaceId]),
  );

  useEffect(() => {
    if (!spaceId || buildings.length === 0) {
      setSummaries({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      buildings.map(async building => {
        try {
          const summary = await accommodationApi.getBuildingSummary(
            spaceId,
            building.buildingId,
          );
          return [building.buildingId, summary] as const;
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
  }, [buildings, spaceId]);

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
            {filteredBuildings.map(building => {
              const summary = summaries[building.buildingId];
              const subtitle = formatBuildingSubtitle(summary, spaceType, t);

              return (
                <ListCard
                  key={building.buildingId}
                  title={building.name}
                  subtitle={
                    subtitle ??
                    (building.code
                      ? t('accommodation.buildings.code', { value: building.code })
                      : t('accommodation.home.manageHint'))
                  }
                  iconLabel={(building.name || '?').charAt(0).toUpperCase()}
                  editableName={canManage}
                  onSaveName={async name => {
                    await renameBuildingName(spaceId, building.buildingId, name);
                    showToast(t('accommodation.buildings.updateSuccess'));
                    await refresh();
                  }}
                  onPress={() => openBuilder(building)}
                />
              );
            })}
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
