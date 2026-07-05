import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../../../api/accommodationApi';
import type {
  AccommodationStatus,
  AllocationTargetSearchResponse,
  BuildingResponse,
  FloorListItemResponse,
  UUID,
} from '../../../../api/types';
import { AccommodationSearchBar } from '../../../../components/accommodation/AccommodationSearchBar';
import { AccommodationStatusBadge } from '../../../../components/accommodation/AccommodationStatusBadge';
import { AccommodationListFooter } from '../../../../components/accommodation/AccommodationListFooter';
import { useAllocationTargetSearch } from '../../../../hooks/useAllocationTargetSearch';
import { colors, radius, spacing, typography } from '../../../../theme';

type TargetPickerStepProps = {
  spaceId: UUID;
  selectableOnly?: boolean;
  hideTitle?: boolean;
  onSelect: (target: AllocationTargetSearchResponse) => void;
};

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const STATUS_FILTERS: AccommodationStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'BLOCKED',
];

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function TargetPickerStep({
  spaceId,
  selectableOnly = true,
  hideTitle = false,
  onSelect,
}: TargetPickerStepProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [floors, setFloors] = useState<FloorListItemResponse[]>([]);
  const [buildingId, setBuildingId] = useState<UUID | undefined>();
  const [floorId, setFloorId] = useState<UUID | undefined>();
  const [statusFilter, setStatusFilter] = useState<AccommodationStatus | undefined>();

  const browsingNonAvailable =
    statusFilter != null && statusFilter !== 'AVAILABLE';
  const effectiveSelectableOnly = selectableOnly && !browsingNonAvailable;

  const { results, loading, loadingMore, error, hasMore, loadMore } =
    useAllocationTargetSearch(spaceId, query, {
      buildingId,
      floorId,
      selectableOnly: effectiveSelectableOnly,
      status: statusFilter,
      enabled: true,
    });

  useEffect(() => {
    void accommodationApi.getBuildings(spaceId).then(setBuildings).catch(() => {});
  }, [spaceId]);

  useEffect(() => {
    if (!buildingId) {
      setFloors([]);
      setFloorId(undefined);
      return;
    }
    void accommodationApi
      .searchFloors(spaceId, buildingId, { page: 0, size: 50 })
      .then(response => setFloors(response.content))
      .catch(() => setFloors([]));
  }, [buildingId, spaceId]);

  const selectedBuilding = buildings.find(b => b.buildingId === buildingId);

  return (
    <View style={styles.wrap}>
      {!hideTitle ? (
        <>
          <Text style={styles.title}>{t('occupancyWizard.steps.target')}</Text>
          <Text style={styles.hint}>{t('occupancyWizard.steps.targetHint')}</Text>
        </>
      ) : null}

      <AccommodationSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('occupancyWizard.searchTargetPlaceholder')}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <FilterChip
          label={t('occupancyWizard.filters.allBuildings')}
          selected={!buildingId}
          onPress={() => {
            setBuildingId(undefined);
            setFloorId(undefined);
          }}
        />
        {buildings.map(building => (
          <FilterChip
            key={building.buildingId}
            label={building.name}
            selected={buildingId === building.buildingId}
            onPress={() => {
              setBuildingId(building.buildingId);
              setFloorId(undefined);
            }}
          />
        ))}
      </ScrollView>

      {selectedBuilding && floors.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <FilterChip
            label={t('occupancyWizard.filters.allFloors')}
            selected={!floorId}
            onPress={() => setFloorId(undefined)}
          />
          {floors.map(floor => (
            <FilterChip
              key={floor.floorId}
              label={floor.name}
              selected={floorId === floor.floorId}
              onPress={() => setFloorId(floor.floorId)}
            />
          ))}
        </ScrollView>
      ) : null}

      <Text style={styles.filterLabel}>{t('occupancyWizard.filters.status')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <FilterChip
          label={t('occupancyWizard.filters.allStatuses')}
          selected={!statusFilter}
          onPress={() => setStatusFilter(undefined)}
        />
        {STATUS_FILTERS.map(status => (
          <FilterChip
            key={status}
            label={t(`accommodation.status.${status}`)}
            selected={statusFilter === status}
            onPress={() =>
              setStatusFilter(statusFilter === status ? undefined : status)
            }
          />
        ))}
      </ScrollView>

      {browsingNonAvailable ? (
        <Text style={styles.browseHint}>{t('occupancyWizard.filters.statusBrowseHint')}</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && results.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => `${item.targetType}-${item.targetId}`}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={<AccommodationListFooter loadingMore={loadingMore} />}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>
                {statusFilter
                  ? buildingId && selectedBuilding?.name
                    ? t('occupancyWizard.noTargetsWithStatusInBuilding', {
                        status: t(`accommodation.status.${statusFilter}`),
                        building: selectedBuilding.name,
                      })
                    : t('occupancyWizard.noTargetsWithStatus', {
                        status: t(`accommodation.status.${statusFilter}`),
                      })
                  : buildingId
                    ? t('occupancyWizard.noTargetsInBuilding', {
                        building: selectedBuilding?.name ?? '',
                      })
                    : t('occupancyWizard.noTargets')}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.selectable && styles.rowDisabled]}
              disabled={!item.selectable}
              onPress={() => onSelect(item)}>
              <View style={styles.rowCopy}>
                <Text style={styles.path}>{item.displayPath}</Text>
                {item.defaultRent != null && item.defaultRent > 0 ? (
                  <Text style={styles.rentHint}>
                    {t('occupancy.contract.catalogRentHint', {
                      amount: item.defaultRent.toLocaleString('en-IN'),
                    })}
                  </Text>
                ) : null}
                {!item.selectable && item.notSelectableReason ? (
                  <Text style={styles.reason}>{item.notSelectableReason}</Text>
                ) : null}
              </View>
              <AccommodationStatusBadge status={item.status} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 360 },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.md },
  title: { ...typography.h3, marginBottom: spacing.xs },
  hint: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  chipRow: { marginBottom: spacing.sm, maxHeight: 44 },
  filterLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  browseHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextSelected: { color: colors.primaryDark, fontWeight: '600' },
  loader: { marginVertical: spacing.lg },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowDisabled: { opacity: 0.55 },
  rowCopy: { flex: 1 },
  path: { ...typography.bodyStrong },
  rentHint: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  reason: { ...typography.caption, color: '#B45309', marginTop: spacing.xs },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
