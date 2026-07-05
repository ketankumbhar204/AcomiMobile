import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { OccupancyResponse, UUID } from '../../api/types';
import { AccommodationEntityRow } from '../../components/accommodation/AccommodationEntityRow';
import { EmptyState, ListSearchFilterBar, SkeletonCard } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import {
  useSpaceOccupancyList,
  type DashboardOccupancyListMode,
} from '../../hooks/useSpaceOccupancyList';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type Route = {
  key: string;
  name: 'DashboardOccupancyList';
  params: {
    spaceId: UUID;
    mode: DashboardOccupancyListMode;
  };
};

type Nav = NativeStackNavigationProp<MainStackParamList, 'DashboardOccupancyList'>;

function formatOccupancyLocation(row: OccupancyResponse): string {
  return [
    row.buildingName,
    row.floorName,
    row.unitName,
    row.roomName,
    row.bedName,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function DashboardOccupancyListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, mode } = route.params;
  const [searchQuery, setSearchQuery] = useState('');

  const occupancies = useSpaceOccupancyList({
    spaceId,
    mode,
    query: searchQuery,
  });

  const subtitle =
    mode === 'moveInsThisMonth'
      ? t('dashboard.drilldown.moveInsSubtitle')
      : t('dashboard.drilldown.occupiedBedsSubtitle');

  const empty = useMemo(
    () => ({
      title:
        searchQuery.trim().length > 0
          ? t('list.emptyFiltered')
          : mode === 'moveInsThisMonth'
            ? t('dashboard.drilldown.emptyMoveIns')
            : t('dashboard.drilldown.emptyOccupiedBeds'),
      description:
        searchQuery.trim().length > 0
          ? undefined
          : t('dashboard.drilldown.emptyOccupancyDescription'),
    }),
    [mode, searchQuery, t],
  );

  const handlePress = useCallback(
    (row: OccupancyResponse) => {
      navigation.navigate('MemberDetails', {
        spaceId,
        memberId: row.memberId,
      });
    },
    [navigation, spaceId],
  );

  return (
    <Screen style={styles.screen}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <ListSearchFilterBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('dashboard.drilldown.searchResidents')}
      />

      {occupancies.loading && occupancies.items.length === 0 ? (
        <SkeletonCard />
      ) : occupancies.items.length === 0 ? (
        <EmptyState title={empty.title} description={empty.description} />
      ) : (
        <FlatList
          data={occupancies.items}
          keyExtractor={item => item.occupancyId}
          refreshControl={
            <RefreshControl
              refreshing={occupancies.refreshing}
              onRefresh={() => void occupancies.refresh()}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AccommodationEntityRow
              title={item.memberName}
              subtitle={formatOccupancyLocation(item)}
              meta={
                <Text style={styles.meta} numberOfLines={1}>
                  {item.moveInDate
                    ? t('dashboard.drilldown.moveInLine', { date: item.moveInDate })
                    : null}
                  {item.rentSnapshot != null
                    ? ` · ${formatComboPrice(item.rentSnapshot, 'INR')}`
                    : null}
                </Text>
              }
              onPress={() => handlePress(item)}
              showChevron
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
});
