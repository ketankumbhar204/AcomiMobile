import { computeStructureTotals } from './setupStructureModel';
import type { EditableBed, EditableSetupStructure, SetupStructureTotals } from './setupStructureTypes';

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

export function summarizeSetupPricing(structure: EditableSetupStructure): SetupCreateSummary {
  const groups = new Map<string, SetupPricingGroup>();
  for (const bed of collectBeds(structure)) {
    const rent = bed.defaultRent ?? null;
    const deposit = bed.defaultDeposit ?? null;
    const key = `${rent ?? 'none'}|${deposit ?? 'none'}`;
    const existing = groups.get(key);
    if (existing) {
      existing.bedCount += 1;
    } else {
      groups.set(key, { key, rent, deposit, bedCount: 1 });
    }
  }
  return {
    buildingName: structure.building.name.trim(),
    totals: computeStructureTotals(structure),
    pricingGroups: [...groups.values()].sort((a, b) => b.bedCount - a.bedCount),
  };
}
