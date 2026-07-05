import type { PropertyLayoutMode, RoomType, SpaceType } from '../../../api/types';

export type EditableBed = {
  id: string;
  label: string;
  number: string;
};

export type EditableRoom = {
  id: string;
  name: string;
  number: string;
  capacity: number;
  beds: EditableBed[];
};

export type EditableUnit = {
  id: string;
  name: string;
  number: string;
  rooms: EditableRoom[];
};

export type EditableFloor = {
  id: string;
  name: string;
  number: number;
  units: EditableUnit[];
  /** Corridor layouts: rooms directly on the floor. */
  rooms: EditableRoom[];
};

export type StructureKind = 'floors_with_units' | 'floors_with_rooms' | 'building_units';

export type EditableSetupStructure = {
  building: {
    name: string;
    code: string;
  };
  kind: StructureKind;
  layoutMode: PropertyLayoutMode;
  spaceType: SpaceType;
  roomType: RoomType;
  floors: EditableFloor[];
  /** Co-living / rental units when there are no floors. */
  units: EditableUnit[];
};

export type SetupStructureTotals = {
  floors: number;
  units: number;
  rooms: number;
  beds: number;
};

export type ExpandStructureConfig = {
  buildingName: string;
  buildingCode: string;
  layoutMode: PropertyLayoutMode;
  spaceType: SpaceType;
  roomType: RoomType;
  roomsPerParent: number;
  bedsPerRoom: number;
  capacityPerRoom: number;
  includeGroundFloor: boolean;
};
