import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type { FloorListItemResponse, SpaceType, UnitListItemResponse, UUID } from '../../api/types';
import { useBuildings } from '../../hooks/useBuildings';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  getBedInventoryFilterLevelsForContext,
  getBedInventoryUnitFilterParent,
  resolveBedInventoryProfile,
  sanitizeBedInventoryFilters,
  type BedInventoryFilterLevel,
} from '../../utils/bedInventoryHierarchy';
import type { DashboardBedInventoryFilters } from './DashboardBedInventoryFilterDrawer';
import {
  type FilterDropdownOption,
  isFilterOptionSelected,
} from './FilterDropdownField';
import { agentDebugLog } from '../../utils/agentDebugLog';

export type DashboardBedInventoryFilterLabels = {
  buildingName?: string;
  floorName?: string;
  unitName?: string;
};

export type DashboardBedInventoryFilterOverlayLayout = {
  openField: BedInventoryFilterLevel;
  options: FilterDropdownOption[];
  selectedValue?: string;
  anchorBottom: number;
};

export type DashboardBedInventoryFiltersBarHandle = {
  selectOption: (value?: string, field?: BedInventoryFilterLevel) => void;
  closeDropdown: () => void;
};

type DashboardBedInventoryFiltersBarProps = {
  spaceId: UUID;
  spaceType: SpaceType;
  filters: DashboardBedInventoryFilters;
  onChange: (filters: DashboardBedInventoryFilters) => void;
  onLabelsChange?: (labels: DashboardBedInventoryFilterLabels) => void;
  overlayHostRef?: React.RefObject<View | null>;
  onOverlayLayoutChange?: (layout: DashboardBedInventoryFilterOverlayLayout | null) => void;
};

const DROPDOWN_MAX_HEIGHT = Dimensions.get('window').height * 0.35;

function FilterTrigger({
  label,
  valueLabel,
  active,
  disabled,
  onPress,
}: {
  label: string;
  valueLabel: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.filterField}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          active && styles.triggerActive,
          disabled && styles.triggerDisabled,
          pressed && !disabled && !active && styles.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: active, disabled: Boolean(disabled) }}
        accessibilityLabel={`${label}: ${valueLabel}`}>
        <Text
          style={[styles.value, disabled && styles.valueDisabled]}
          numberOfLines={1}>
          {valueLabel}
        </Text>
        <Text style={[styles.chevron, active && styles.chevronActive]}>
          {active ? '▴' : '▾'}
        </Text>
      </Pressable>
    </View>
  );
}

export function DashboardBedInventoryFilterDropdownOverlay({
  layout,
  onSelect,
  onClose,
}: {
  layout: DashboardBedInventoryFilterOverlayLayout;
  onSelect: (value?: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { anchorBottom, options, selectedValue, openField } = layout;

  return (
    <>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('navigation.closeFilterDropdown')}
      />
      <View
        style={[styles.dropdownOverlay, { top: anchorBottom }]}
        onLayout={event => {
          // #region agent log
          agentDebugLog({
            hypothesisId: 'C',
            location: 'DashboardBedInventoryFilterDropdownOverlay:onLayout',
            message: 'floating dropdown rendered',
            data: {
              openField,
              optionCount: options.length,
              height: event.nativeEvent.layout.height,
              anchorBottom,
              maxHeight: DROPDOWN_MAX_HEIGHT,
              position: 'absolute',
              pushesLayout: false,
            },
            runId: 'bed-filter-overlay',
          });
          // #endregion
        }}>
        <FlatList
          data={options}
          keyExtractor={item => item.value ?? '__all__'}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={styles.dropdownList}
          showsVerticalScrollIndicator
          renderItem={({ item }) => {
            const selected = isFilterOptionSelected(item, selectedValue);
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && !selected && styles.optionPressed,
                ]}
                onPress={() => onSelect(item.value)}>
                <Text
                  style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                  numberOfLines={1}>
                  {item.label}
                </Text>
                {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
              </Pressable>
            );
          }}
        />
      </View>
    </>
  );
}

export const DashboardBedInventoryFiltersBar = forwardRef<
  DashboardBedInventoryFiltersBarHandle,
  DashboardBedInventoryFiltersBarProps
>(function DashboardBedInventoryFiltersBar(
  {
    spaceId,
    spaceType,
    filters,
    onChange,
    onLabelsChange,
    overlayHostRef,
    onOverlayLayoutChange,
  },
  ref,
) {
  const { t } = useTranslation();
  const { buildings, loading: loadingBuildings } = useBuildings(spaceId);
  const [floors, setFloors] = useState<FloorListItemResponse[]>([]);
  const [units, setUnits] = useState<UnitListItemResponse[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [openField, setOpenField] = useState<BedInventoryFilterLevel | null>(null);
  const filterRowRef = useRef<View>(null);
  const [rowBottom, setRowBottom] = useState(0);

  const inventoryProfile = useMemo(
    () => resolveBedInventoryProfile(spaceType, buildings, filters.buildingId),
    [buildings, filters.buildingId, spaceType],
  );

  const filterLevels = useMemo(
    () => getBedInventoryFilterLevelsForContext(spaceType, buildings, filters.buildingId),
    [buildings, filters.buildingId, spaceType],
  );

  const unitFilterParent = useMemo(
    () => getBedInventoryUnitFilterParent(inventoryProfile),
    [inventoryProfile],
  );

  useEffect(() => {
    const sanitized = sanitizeBedInventoryFilters(filters, filterLevels);
    if (
      sanitized.floorId !== filters.floorId ||
      sanitized.unitId !== filters.unitId
    ) {
      onChange(sanitized);
    }
  }, [filterLevels, filters, onChange]);

  useEffect(() => {
    if (openField && !filterLevels.includes(openField)) {
      setOpenField(null);
    }
  }, [filterLevels, openField]);

  // Prefer the only building / floor / unit instead of "All …".
  useEffect(() => {
    if (loadingBuildings || buildings.length !== 1 || filters.buildingId) {
      return;
    }
    onChange({
      buildingId: buildings[0].buildingId,
      floorId: undefined,
      unitId: undefined,
    });
  }, [buildings, filters.buildingId, loadingBuildings, onChange]);

  useEffect(() => {
    if (!filters.buildingId || !filterLevels.includes('floor')) {
      setFloors([]);
      setLoadingFloors(false);
      return;
    }

    let cancelled = false;
    setLoadingFloors(true);

    void accommodationApi
      .listFloors(spaceId, filters.buildingId, { size: 100 })
      .then(response => {
        if (!cancelled) {
          setFloors(response.content);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFloors([]);
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
  }, [filterLevels, filters.buildingId, spaceId]);

  useEffect(() => {
    if (
      loadingFloors ||
      floors.length !== 1 ||
      !filters.buildingId ||
      filters.floorId ||
      !filterLevels.includes('floor')
    ) {
      return;
    }
    onChange({
      buildingId: filters.buildingId,
      floorId: floors[0].floorId,
      unitId: undefined,
    });
  }, [
    filterLevels,
    filters.buildingId,
    filters.floorId,
    floors,
    loadingFloors,
    onChange,
  ]);

  useEffect(() => {
    if (!filters.buildingId || !filterLevels.includes('unit') || !unitFilterParent) {
      setUnits([]);
      setLoadingUnits(false);
      return;
    }

    if (unitFilterParent === 'floor' && !filters.floorId) {
      setUnits([]);
      setLoadingUnits(false);
      return;
    }

    let cancelled = false;
    setLoadingUnits(true);

    const loadUnits =
      unitFilterParent === 'floor'
        ? accommodationApi.listUnitsByFloor(spaceId, filters.buildingId, filters.floorId!, {
            size: 100,
          })
        : accommodationApi.listUnits(spaceId, filters.buildingId, { size: 100 });

    void loadUnits
      .then(response => {
        if (!cancelled) {
          setUnits(response.content.filter(item => !item.synthetic));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnits([]);
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
  }, [
    filterLevels,
    filters.buildingId,
    filters.floorId,
    spaceId,
    unitFilterParent,
  ]);

  useEffect(() => {
    if (
      loadingUnits ||
      units.length !== 1 ||
      !filters.buildingId ||
      filters.unitId ||
      !filterLevels.includes('unit')
    ) {
      return;
    }
    if (unitFilterParent === 'floor' && !filters.floorId) {
      return;
    }
    onChange({
      buildingId: filters.buildingId,
      floorId: filters.floorId,
      unitId: units[0].unitId,
    });
  }, [
    filterLevels,
    filters.buildingId,
    filters.floorId,
    filters.unitId,
    loadingUnits,
    onChange,
    unitFilterParent,
    units,
  ]);

  const buildingOptions = useMemo(
    () => [
      { label: t('dashboard.drilldown.allBuildings') },
      ...buildings.map(b => ({ value: b.buildingId, label: b.name })),
    ],
    [buildings, t],
  );

  const floorOptions = useMemo(
    () => [
      { label: t('dashboard.drilldown.allFloors') },
      ...floors.map(f => ({ value: f.floorId, label: f.name })),
    ],
    [floors, t],
  );

  const unitOptions = useMemo(
    () => [
      { label: t('dashboard.drilldown.allUnits') },
      ...units.map(u => ({ value: u.unitId, label: u.name })),
    ],
    [t, units],
  );

  const buildingLabel =
    buildingOptions.find(o => o.value === filters.buildingId)?.label ??
    t('dashboard.drilldown.allBuildings');
  const floorLabel =
    floorOptions.find(o => o.value === filters.floorId)?.label ??
    t('dashboard.drilldown.allFloors');
  const unitLabel =
    unitOptions.find(o => o.value === filters.unitId)?.label ??
    t('dashboard.drilldown.allUnits');

  useEffect(() => {
    onLabelsChange?.({
      buildingName: buildingLabel,
      floorName: filterLevels.includes('floor') ? floorLabel : undefined,
      unitName: filterLevels.includes('unit') ? unitLabel : undefined,
    });
  }, [buildingLabel, filterLevels, floorLabel, onLabelsChange, unitLabel]);

  const toggleField = (field: BedInventoryFilterLevel) => {
    setOpenField(current => {
      const next = current === field ? null : field;
      // #region agent log
      agentDebugLog({
        hypothesisId: 'A',
        location: 'DashboardBedInventoryFiltersBar.tsx:toggleField',
        message: 'filter toggle',
        data: { field, previous: current, next, usesFloatingOverlay: true },
        runId: 'bed-filter-overlay',
      });
      // #endregion
      return next;
    });
  };

  const openOptions = useMemo((): FilterDropdownOption[] => {
    if (openField === 'building') {
      return buildingOptions;
    }
    if (openField === 'floor') {
      return floorOptions;
    }
    if (openField === 'unit') {
      return unitOptions;
    }
    return [];
  }, [buildingOptions, floorOptions, openField, unitOptions]);

  const openSelectedValue =
    openField === 'building'
      ? filters.buildingId
      : openField === 'floor'
        ? filters.floorId
        : openField === 'unit'
          ? filters.unitId
          : undefined;

  const filterFieldMeta = useMemo(
    () =>
      ({
        building: {
          label: t('occupancy.section.building'),
          valueLabel: loadingBuildings
            ? t('common.loading', { defaultValue: 'Loading…' })
            : buildingLabel,
          disabled: false,
        },
        floor: {
          label: t('occupancy.section.floor'),
          valueLabel: loadingFloors
            ? t('common.loading', { defaultValue: 'Loading…' })
            : floorLabel,
          // Enable as soon as a building is chosen; loading is shown in the label.
          disabled: !filters.buildingId,
        },
        unit: {
          label: t('occupancy.section.unit'),
          valueLabel: loadingUnits
            ? t('common.loading', { defaultValue: 'Loading…' })
            : unitLabel,
          disabled:
            unitFilterParent === 'floor'
              ? !filters.buildingId || !filters.floorId
              : !filters.buildingId,
        },
      }) satisfies Record<
        BedInventoryFilterLevel,
        { label: string; valueLabel: string; disabled: boolean }
      >,
    [
      buildingLabel,
      filters.buildingId,
      filters.floorId,
      floorLabel,
      loadingBuildings,
      loadingFloors,
      loadingUnits,
      t,
      unitFilterParent,
      unitLabel,
    ],
  );

  const handleSelect = useCallback(
    (value?: string, field?: BedInventoryFilterLevel) => {
      const targetField = field ?? openField;
      // #region agent log
      agentDebugLog({
        hypothesisId: 'B',
        location: 'DashboardBedInventoryFiltersBar.tsx:handleSelect',
        message: 'filter option selected',
        data: {
          openField,
          targetField,
          value: value ?? null,
          priorBuildingId: filters.buildingId ?? null,
          priorFloorId: filters.floorId ?? null,
          priorUnitId: filters.unitId ?? null,
        },
        runId: 'bed-filter-overlay',
      });
      // #endregion
      if (targetField === 'building') {
        onChange({
          buildingId: value,
          floorId: undefined,
          unitId: undefined,
        });
      } else if (targetField === 'floor') {
        onChange({
          buildingId: filters.buildingId,
          floorId: value,
          unitId: undefined,
        });
      } else if (targetField === 'unit') {
        onChange({
          buildingId: filters.buildingId,
          floorId: filters.floorId,
          unitId: value,
        });
      }
      setOpenField(null);
    },
    [filters.buildingId, filters.floorId, onChange, openField],
  );

  const closeDropdown = useCallback(() => {
    setOpenField(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      selectOption: handleSelect,
      closeDropdown,
    }),
    [closeDropdown, handleSelect],
  );

  const measureRowAnchor = useCallback(() => {
    const host = overlayHostRef?.current;
    const row = filterRowRef.current;
    if (!host || !row) {
      return;
    }

    row.measureLayout(
      host,
      (_x, y, _width, height) => {
        setRowBottom(y + height);
      },
      () => {
        // #region agent log
        agentDebugLog({
          hypothesisId: 'D',
          location: 'DashboardBedInventoryFiltersBar.tsx:measureRowAnchor',
          message: 'measureLayout failed',
          data: { openField },
          runId: 'bed-filter-overlay',
        });
        // #endregion
      },
    );
  }, [overlayHostRef, openField]);

  useEffect(() => {
    if (!openField) {
      onOverlayLayoutChange?.(null);
      return;
    }

    measureRowAnchor();
  }, [measureRowAnchor, onOverlayLayoutChange, openField]);

  useEffect(() => {
    if (!openField || rowBottom <= 0) {
      return;
    }

    onOverlayLayoutChange?.({
      openField,
      options: openOptions,
      selectedValue: openSelectedValue,
      anchorBottom: rowBottom,
    });
  }, [
    onOverlayLayoutChange,
    openField,
    openOptions,
    openSelectedValue,
    rowBottom,
  ]);

  if (loadingBuildings && buildings.length === 0) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={styles.wrap}>
      <View
        ref={filterRowRef}
        style={styles.row}
        onLayout={() => {
          if (openField) {
            measureRowAnchor();
          }
        }}>
        {filterLevels.map(level => {
          const meta = filterFieldMeta[level];
          return (
            <FilterTrigger
              key={level}
              label={meta.label}
              valueLabel={meta.valueLabel}
              active={openField === level}
              disabled={meta.disabled}
              onPress={() => toggleField(level)}
            />
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  filterField: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xxs,
  },
  triggerActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  triggerPressed: {
    backgroundColor: colors.surface,
  },
  value: {
    flex: 1,
    ...typography.body,
    fontSize: 13,
    color: colors.textPrimary,
  },
  valueDisabled: {
    color: colors.muted,
  },
  chevron: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 11,
  },
  chevronActive: {
    color: colors.primaryDark,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
    elevation: 18,
  },
  dropdownOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxHeight: DROPDOWN_MAX_HEIGHT,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 20,
    ...shadows.md,
  },
  dropdownList: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.lightGreen,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionLabel: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  optionCheck: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontSize: 16,
  },
  loader: {
    marginBottom: spacing.sm,
  },
});
