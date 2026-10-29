import { computeStructureTotals } from './setupStructureModel';
import type {
  EditableBed,
  EditableSetupStructure,
  EditableUnit,
  SetupStructureTotals,
} from './setupStructureTypes';

export type SetupPricingGroup = {
  key: string;
  rent: number | null;
  deposit: number | null;
  bedCount: number;
};

export type SetupCreateSummary = {
  buildingName: string;
  totals: SetupStructureTotals;
  pricingGroups: SetupPricingGroup[];
  /** Beds carry pricing for PG, hostel, and co-living. Units carry it for rental. */
  pricingSubject: 'beds' | 'units';
};

function collectBeds(structure: EditableSetupStructure): EditableBed[] {
  const beds: EditableBed[] = [];
  const pushRoomBeds = (rooms: { beds: EditableBed[] }[]) => {
    for (const room of rooms) {
      beds.push(...room.beds);
    }
  };
  if (structure.kind === 'building_units') {
    for (const unit of structure.units) {
      pushRoomBeds(unit.rooms);
    }
    return beds;
  }
  for (const floor of structure.floors) {
    if (structure.kind === 'floors_with_units') {
      for (const unit of floor.units) {
        pushRoomBeds(unit.rooms);
      }
    } else {
      pushRoomBeds(floor.rooms);
    }
  }
  return beds;
}

function collectUnits(structure: EditableSetupStructure): EditableUnit[] {
  if (structure.kind === 'building_units') {
    return structure.units;
  }
  return structure.floors.flatMap(floor => floor.units);
}

function pricingGroupsFrom(
  items: Array<{ defaultRent?: number | null; defaultDeposit?: number | null }>,
): SetupPricingGroup[] {
  const groups = new Map<string, SetupPricingGroup>();
  for (const item of items) {
    const rent = item.defaultRent ?? null;
    const deposit = item.defaultDeposit ?? null;
    if (rent == null && deposit == null) {
      continue;
    }
    const key = `${rent ?? 'none'}|${deposit ?? 'none'}`;
    const existing = groups.get(key);
    if (existing) {
      existing.bedCount += 1;
    } else {
      groups.set(key, { key, rent, deposit, bedCount: 1 });
    }
  }
  return [...groups.values()].sort((a, b) => b.bedCount - a.bedCount);
}

export function summarizeSetupPricing(structure: EditableSetupStructure): SetupCreateSummary {
  const beds = collectBeds(structure);
  const pricingSubject = beds.length > 0 ? 'beds' : 'units';
  return {
    buildingName: structure.building.name.trim(),
    totals: computeStructureTotals(structure),
    pricingSubject,
    pricingGroups: pricingGroupsFrom(beds.length > 0 ? beds : collectUnits(structure)),
  };
}
