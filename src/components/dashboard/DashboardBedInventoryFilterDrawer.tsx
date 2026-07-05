import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type { FloorListItemResponse, UnitListItemResponse, UUID } from '../../api/types';
import { useBuildings } from '../../hooks/useBuildings';
import {
  FilterDrawerDivider,
  FilterDrawerSection,
  FilterRadioRow,
  ListFilterDrawer,
} from '../ui';
import { countFilterDimensions } from '../../utils/filterCount';

export type DashboardBedInventoryFilters = {
  buildingId?: UUID;
  floorId?: UUID;
  unitId?: UUID;
};

export function defaultDashboardBedInventoryFilters(): DashboardBedInventoryFilters {
  return {};
}

export function countDashboardBedInventoryFilters(
  filters: DashboardBedInventoryFilters,
): number {
  return countFilterDimensions([
    { active: Boolean(filters.buildingId) },
    { active: Boolean(filters.floorId) },
    { active: Boolean(filters.unitId) },
  ]);
}

type DashboardBedInventoryFilterDrawerProps = {
  visible: boolean;
  spaceId: UUID;
  applied: DashboardBedInventoryFilters;
  onClose: () => void;
  onApply: (filters: DashboardBedInventoryFilters) => void;
};

export function DashboardBedInventoryFilterDrawer({
  visible,
  spaceId,
  applied,
  onClose,
  onApply,
}: DashboardBedInventoryFilterDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DashboardBedInventoryFilters>(applied);
  const [floors, setFloors] = useState<FloorListItemResponse[]>([]);
  const [units, setUnits] = useState<UnitListItemResponse[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const { buildings, loading: loadingBuildings } = useBuildings(spaceId, { enabled: visible });

  useEffect(() => {
    if (visible) {
      setDraft(applied);
    }
  }, [applied, visible]);

  useEffect(() => {
    if (!visible || !draft.buildingId) {
      setFloors([]);
      return;
    }

    let cancelled = false;
    setLoadingFloors(true);

    void accommodationApi
      .listFloors(spaceId, draft.buildingId, { size: 100 })
      .then(response => {
        if (!cancelled) {
          setFloors(response.content);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFloors(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draft.buildingId, spaceId, visible]);

  useEffect(() => {
    if (!visible || !draft.buildingId || !draft.floorId) {
      setUnits([]);
      return;
    }

    let cancelled = false;
    setLoadingUnits(true);

    void accommodationApi
      .listUnitsByFloor(spaceId, draft.buildingId, draft.floorId, { size: 100 })
      .then(response => {
        if (!cancelled) {
          setUnits(response.content);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUnits(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draft.buildingId, draft.floorId, spaceId, visible]);

  const selectBuilding = (buildingId?: UUID) => {
    setDraft(prev => ({
      buildingId,
      floorId: undefined,
      unitId: undefined,
    }));
  };

  const selectFloor = (floorId?: UUID) => {
    setDraft(prev => ({
      ...prev,
      floorId,
      unitId: undefined,
    }));
  };

  const selectUnit = (unitId?: UUID) => {
    setDraft(prev => ({
      ...prev,
      unitId,
    }));
  };

  return (
    <ListFilterDrawer
      visible={visible}
      title={t('dashboard.drilldown.filterTitle')}
      onClose={onClose}
      onReset={() => setDraft({})}
      onApply={() => {
        onApply(draft);
        onClose();
      }}>
      <FilterDrawerSection title={t('occupancy.section.building')}>
        {loadingBuildings ? (
          <ActivityIndicator />
        ) : (
          <>
            <FilterRadioRow
              label={t('list.filters.all')}
              selected={!draft.buildingId}
              onSelect={() => selectBuilding(undefined)}
            />
            {buildings.map(building => (
              <FilterRadioRow
                key={building.buildingId}
                label={building.name}
                selected={draft.buildingId === building.buildingId}
                onSelect={() => selectBuilding(building.buildingId)}
              />
            ))}
          </>
        )}
      </FilterDrawerSection>

      {draft.buildingId ? (
        <>
          <FilterDrawerDivider />
          <FilterDrawerSection title={t('occupancy.section.floor')}>
            {loadingFloors ? (
              <ActivityIndicator />
            ) : (
              <>
                <FilterRadioRow
                  label={t('list.filters.all')}
                  selected={!draft.floorId}
                  onSelect={() => selectFloor(undefined)}
                />
                {floors.map(floor => (
                  <FilterRadioRow
                    key={floor.floorId}
                    label={floor.name}
                    selected={draft.floorId === floor.floorId}
                    onSelect={() => selectFloor(floor.floorId)}
                  />
                ))}
              </>
            )}
          </FilterDrawerSection>
        </>
      ) : null}

      {draft.buildingId && draft.floorId ? (
        <>
          <FilterDrawerDivider />
          <FilterDrawerSection title={t('occupancy.section.unit')}>
            {loadingUnits ? (
              <ActivityIndicator />
            ) : (
              <>
                <FilterRadioRow
                  label={t('list.filters.all')}
                  selected={!draft.unitId}
                  onSelect={() => selectUnit(undefined)}
                />
                {units.map(unit => (
                  <FilterRadioRow
                    key={unit.unitId}
                    label={unit.name}
                    selected={draft.unitId === unit.unitId}
                    onSelect={() => selectUnit(unit.unitId)}
                  />
                ))}
              </>
            )}
          </FilterDrawerSection>
        </>
      ) : null}
    </ListFilterDrawer>
  );
}
