import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuildingResponse, SpaceType } from '../api/types';
import { BuildingPickerModal } from '../components/occupancy/BuildingPickerModal';
import { HierarchyOccupancyPickerModal } from '../components/occupancy/HierarchyOccupancyPickerModal';
import type { MenuOption } from '../components/accommodation/BuilderRowLifecycleMenu';
import type { HierarchyOccupancyScope } from '../utils/hierarchyOccupancySteps';

type PickerState =
  | {
      step: 'building';
      mode: 'ALLOCATE' | 'RESERVE';
      bulk: boolean;
    }
  | {
      step: 'hierarchy';
      scope: HierarchyOccupancyScope;
      mode: 'ALLOCATE' | 'RESERVE';
      bulk: boolean;
    };

function buildingToScope(building: BuildingResponse): HierarchyOccupancyScope {
  return {
    buildingId: building.buildingId,
    buildingName: building.name,
    layoutMode: building.layoutMode,
  };
}

export function useHierarchyOccupancyPicker(spaceId: string, spaceType: SpaceType | undefined) {
  const { t } = useTranslation();
  const [pickerState, setPickerState] = useState<PickerState | null>(null);

  const openPicker = useCallback(
    (scope: HierarchyOccupancyScope, mode: 'ALLOCATE' | 'RESERVE', bulk = false) => {
      setPickerState({ step: 'hierarchy', scope, mode, bulk });
    },
    [],
  );

  const openFromSpace = useCallback(
    (mode: 'ALLOCATE' | 'RESERVE', bulk = false) => {
      setPickerState({ step: 'building', mode, bulk });
    },
    [],
  );

  const closePicker = useCallback(() => {
    setPickerState(null);
  }, []);

  const handleBuildingSelect = useCallback((building: BuildingResponse) => {
    setPickerState(current => {
      if (!current || current.step !== 'building') {
        return current;
      }
      return {
        step: 'hierarchy',
        scope: buildingToScope(building),
        mode: current.mode,
        bulk: current.bulk,
      };
    });
  }, []);

  const buildMenuOptions = useCallback(
    (scope: HierarchyOccupancyScope, onViewOccupancy?: () => void): MenuOption[] => {
      if (!spaceType) {
        return [];
      }

      const options: MenuOption[] = [
        {
          label: t('occupancy.hierarchy.menu.allocateResident'),
          action: () => openPicker(scope, 'ALLOCATE'),
        },
        {
          label: t('occupancy.hierarchy.menu.reserveBed'),
          action: () => openPicker(scope, 'RESERVE'),
        },
        {
          label: t('occupancy.hierarchy.menu.bulkAllocate'),
          action: () => openPicker(scope, 'ALLOCATE', true),
        },
        {
          label: t('occupancy.hierarchy.menu.bulkReserve'),
          action: () => openPicker(scope, 'RESERVE', true),
        },
      ];

      if (onViewOccupancy) {
        options.push({
          label: t('occupancy.hierarchy.menu.viewOccupancy'),
          action: onViewOccupancy,
        });
      }

      return options;
    },
    [openPicker, spaceType, t],
  );

  const pickerTitle = useCallback(
    (mode: 'ALLOCATE' | 'RESERVE') =>
      mode === 'RESERVE'
        ? t('occupancy.hierarchy.reserveTitle')
        : t('occupancy.hierarchy.allocateTitle'),
    [t],
  );

  const pickerModal = useMemo(() => {
    if (!spaceType || !pickerState) {
      return null;
    }

    if (pickerState.step === 'building') {
      return (
        <BuildingPickerModal
          visible
          spaceId={spaceId}
          title={pickerTitle(pickerState.mode)}
          onClose={closePicker}
          onSelect={handleBuildingSelect}
        />
      );
    }

    return (
      <HierarchyOccupancyPickerModal
        visible
        spaceId={spaceId}
        spaceType={spaceType}
        scope={pickerState.scope}
        wizardMode={pickerState.mode}
        bulkMode={pickerState.bulk}
        onClose={closePicker}
      />
    );
  }, [closePicker, handleBuildingSelect, pickerState, pickerTitle, spaceId, spaceType]);

  return {
    buildMenuOptions,
    pickerModal,
    openPicker,
    openFromSpace,
    closePicker,
  };
}
