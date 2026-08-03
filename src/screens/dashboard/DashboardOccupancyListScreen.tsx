import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BedDouble, CalendarDays, Users, UtensilsCrossed } from 'lucide-react-native';
import type { OccupancyResponse, UUID } from '../../api/types';
import { AccommodationEntityRow } from '../../components/accommodation/AccommodationEntityRow';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { EmptyState, ListSearchBar, Screen, SkeletonCard } from '../../components/ui';
import {
  useSpaceOccupancyList,
  type DashboardOccupancyListMode,
} from '../../hooks/useSpaceOccupancyList';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
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
  return [row.buildingName, row.floorName, row.unitName, row.roomName, row.bedName]
    .filter(Boolean)
    .join(' · ');
}

function occupancyStatusTone(status: OccupancyResponse['status']): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'RESERVED':
      return { label: 'Reserved', color: '#D97706' };
    case 'VACATED':
      return { label: 'Vacated', color: colors.muted };
    case 'ACTIVE':
    default:
      return { label: 'Occupied', color: colors.primaryDark };
  }
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

  const isMoveIns = mode === 'moveInsThisMonth';
  const heading = isMoveIns
    ? t('dashboard.drilldown.moveInsTitle')
    : t('dashboard.drilldown.occupiedBedsTitle');
  const subtitle = isMoveIns
    ? t('dashboard.drilldown.moveInsSubtitle')
    : t('dashboard.drilldown.occupiedBedsSubtitle');

  const empty = useMemo(
    () => ({
      title:
        searchQuery.trim().length > 0
          ? t('list.emptyFiltered')
          : isMoveIns
            ? t('dashboard.drilldown.emptyMoveIns')
            : t('dashboard.drilldown.emptyOccupiedBeds'),
      description:
        searchQuery.trim().length > 0
          ? undefined
          : t('dashboard.drilldown.emptyOccupancyDescription'),
    }),
    [isMoveIns, searchQuery, t],
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

  const showInitialLoader = occupancies.loading && occupancies.items.length === 0;
  const count = occupancies.items.length;

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      <View style={styles.header}>
        <MealFormHero
          icon={isMoveIns ? CalendarDays : Users}
          eyebrow={t('dashboard.pendingActions.eyebrow', { defaultValue: 'Dashboard' })}
          heading={heading}
          subheading={
            count > 0
              ? t('dashboard.drilldown.occupancyCount', {
                  count,
                  defaultValue: '{{count}} residents',
                })
              : subtitle
          }
          compact
        />
        <ListSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('dashboard.drilldown.searchResidents')}
        />
      </View>

      {showInitialLoader ? (
        <View style={styles.loadingWrap}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : occupancies.items.length === 0 ? (
        <EmptyState
          Icon={isMoveIns ? CalendarDays : Users}
          title={empty.title}
          description={empty.description}
        />
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
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const status = occupancyStatusTone(item.status);
            const foodIncluded = Boolean(item.foodEnabled || item.foodIncludedInRent);
            return (
              <AccommodationEntityRow
                title={item.memberName}
                subtitle={formatOccupancyLocation(item)}
                icon={Users}
                badge={
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: `${status.color}14`,
                        borderColor: `${status.color}33`,
                      },
                    ]}>
                    <Text style={[styles.statusChipText, { color: status.color }]}>
                      {t(`dashboard.drilldown.occupancyStatus.${item.status}`, {
                        defaultValue: status.label,
                      })}
                    </Text>
                  </View>
                }
                meta={
                  <View style={styles.metaCol}>
                    <View style={styles.metaLine}>
                      {item.moveInDate ? (
                        <Text style={styles.meta} numberOfLines={1}>
                          {t('dashboard.drilldown.moveInLine', { date: item.moveInDate })}
                        </Text>
                      ) : null}
                      {item.expectedExitDate || item.expectedCheckoutDate ? (
                        <Text style={styles.meta} numberOfLines={1}>
                          {t('dashboard.drilldown.moveOutLine', {
                            date: item.expectedExitDate ?? item.expectedCheckoutDate,
                            defaultValue: 'Move-out {{date}}',
                          })}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.chipRow}>
                      {item.bedName ? (
                        <View style={styles.metaChip}>
                          <BedDouble size={11} color={colors.muted} strokeWidth={2.2} />
                          <Text style={styles.metaChipText} numberOfLines={1}>
                            {item.bedName}
                          </Text>
                        </View>
                      ) : null}
                      {foodIncluded ? (
                        <View style={[styles.metaChip, styles.foodChip]}>
                          <UtensilsCrossed size={11} color={colors.primaryDark} strokeWidth={2.2} />
                          <Text style={[styles.metaChipText, styles.foodChipText]} numberOfLines={1}>
                            {t('dashboard.drilldown.foodIncluded', {
                              defaultValue: 'Food included',
                            })}
                          </Text>
                        </View>
                      ) : null}
                      {item.rentSnapshot != null ? (
                        <Text style={styles.meta} numberOfLines={1}>
                          {formatComboPrice(item.rentSnapshot, 'INR')}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                }
                onPress={() => handlePress(item)}
                showChevron
              />
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  loadingWrap: {
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  metaCol: {
    gap: spacing.xs,
  },
  metaLine: {
    gap: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '55%',
  },
  metaChipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  foodChip: {
    backgroundColor: colors.lightGreen,
    borderColor: `${colors.primary}33`,
  },
  foodChipText: {
    color: colors.primaryDark,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
});
