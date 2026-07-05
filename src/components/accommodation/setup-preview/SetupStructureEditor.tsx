import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui';
import { useAccommodationActionSheetStore } from '../../../store/accommodationActionSheetStore';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import { executeSetupStructure } from './executeSetupStructure';
import { InlineEditableField, InlineEditableTitle } from './InlineEditableTitle';
import { computeStructureTotals } from './setupStructureModel';
import {
  addBed,
  addRoom,
  addUnit,
  deleteBed,
  deleteFloor,
  deleteRoom,
  deleteUnit,
  duplicateFloor,
  duplicateRoom,
  duplicateUnit,
  moveItem,
  setFloorCount,
} from './setupStructureMutations';
import {
  applyBedNamingPresetToAll,
  applyFloorNamingPreset,
  applyRoomNamingPresetToAll,
  applyUnitNamingPreset,
  getFloorCounts,
  getRoomCounts,
  getUnitCounts,
} from './setupStructureNaming';
import type { EditableBed, EditableFloor, EditableRoom, EditableSetupStructure, EditableUnit, ExpandStructureConfig } from './setupStructureTypes';
import { INITIAL_VISIBLE_FLOORS } from './setupPreviewUtils';

export type SetupStructureEditorProps = {
  structure: EditableSetupStructure;
  onChange: (structure: EditableSetupStructure) => void;
  layoutModeLabel?: string;
  expandConfig: Pick<
    ExpandStructureConfig,
    'roomsPerParent' | 'bedsPerRoom' | 'capacityPerRoom' | 'includeGroundFloor'
  >;
};

function SummaryCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EntityMenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuBtn} accessibilityRole="button">
      <Text style={styles.menuIcon}>⋮</Text>
    </Pressable>
  );
}

function BedRow({
  bed,
  onChange,
  onDelete,
}: {
  bed: EditableBed;
  onChange: (bed: EditableBed) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.bedRow}>
      <InlineEditableTitle
        value={bed.label}
        onSave={label => onChange({ ...bed, label, number: label })}
        style={styles.bedTitle}
      />
      <Pressable onPress={onDelete} style={styles.smallBtn}>
        <Text style={styles.smallBtnText}>{t('accommodation.setup.editor.delete')}</Text>
      </Pressable>
    </View>
  );
}

function RoomSection({
  room,
  structure,
  floorId,
  unitId,
  onChangeStructure,
}: {
  room: EditableRoom;
  structure: EditableSetupStructure;
  floorId: string | null;
  unitId: string | null;
  onChangeStructure: (next: EditableSetupStructure) => void;
}) {
  const { t } = useTranslation();
  const openSheet = useAccommodationActionSheetStore(state => state.open);
  const [expanded, setExpanded] = useState(false);
  const counts = getRoomCounts(room);

  function updateRoom(patch: Partial<EditableRoom>) {
    const patchRooms = (rooms: EditableRoom[]) =>
      rooms.map(item => (item.id === room.id ? { ...item, ...patch } : item));

    if (structure.kind === 'building_units' && unitId) {
      onChangeStructure({
        ...structure,
        units: structure.units.map(unit =>
          unit.id === unitId ? { ...unit, rooms: patchRooms(unit.rooms) } : unit,
        ),
      });
      return;
    }

    if (structure.kind === 'floors_with_units' && floorId && unitId) {
      onChangeStructure({
        ...structure,
        floors: structure.floors.map(floor =>
          floor.id === floorId
            ? {
                ...floor,
                units: floor.units.map(unit =>
                  unit.id === unitId ? { ...unit, rooms: patchRooms(unit.rooms) } : unit,
                ),
              }
            : floor,
        ),
      });
      return;
    }

    if (floorId) {
      onChangeStructure({
        ...structure,
        floors: structure.floors.map(floor =>
          floor.id === floorId ? { ...floor, rooms: patchRooms(floor.rooms) } : floor,
        ),
      });
    }
  }

  function openMenu() {
    openSheet(t('accommodation.setup.editor.roomActions'), [
      {
        label: t('accommodation.setup.editor.duplicate'),
        action: () => onChangeStructure(duplicateRoom(structure, floorId, unitId, room.id)),
      },
      {
        label: t('accommodation.setup.editor.delete'),
        destructive: true,
        action: () => onChangeStructure(deleteRoom(structure, floorId, unitId, room.id)),
      },
      {
        label: t('accommodation.setup.editor.addBed'),
        action: () => onChangeStructure(addBed(structure, floorId, unitId, room.id)),
      },
      {
        label: t('accommodation.setup.editor.applyRoomsAll'),
        action: () => onChangeStructure(applyRoomNamingPresetToAll(structure, 'numbered')),
      },
      {
        label: t('accommodation.setup.editor.presetRoomsLetters'),
        action: () => onChangeStructure(applyRoomNamingPresetToAll(structure, 'letters')),
      },
      {
        label: t('accommodation.setup.editor.moveUp'),
        action: () => {
          if (structure.kind === 'building_units' && unitId) {
            onChangeStructure({
              ...structure,
              units: structure.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: moveItem(unit.rooms, room.id, -1) } : unit,
              ),
            });
          }
        },
      },
      {
        label: t('accommodation.setup.editor.moveDown'),
        action: () => {
          if (structure.kind === 'building_units' && unitId) {
            onChangeStructure({
              ...structure,
              units: structure.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: moveItem(unit.rooms, room.id, 1) } : unit,
              ),
            });
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.nestedCard}>
      <Pressable onPress={() => setExpanded(value => !value)} style={styles.entityHeader}>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
        <View style={styles.entityHeaderBody}>
          <InlineEditableTitle
            value={room.name}
            onSave={name => updateRoom({ name, number: room.number || name })}
          />
          <Text style={styles.countMeta}>
            {t('accommodation.setup.editor.capacityBeds', {
              capacity: counts.capacity,
              beds: counts.beds,
            })}
          </Text>
        </View>
        <EntityMenuButton onPress={openMenu} />
      </Pressable>

      {expanded ? (
        <View style={styles.entityBody}>
          <InlineEditableField
            label={t('accommodation.setup.editor.roomName')}
            value={room.name}
            onSave={name => updateRoom({ name })}
          />
          <InlineEditableField
            label={t('accommodation.setup.editor.roomNumber')}
            value={room.number}
            onSave={number => updateRoom({ number })}
          />
          <InlineEditableField
            label={t('accommodation.setup.editor.capacity')}
            value={String(room.capacity)}
            keyboardType="number-pad"
            onSave={value => updateRoom({ capacity: Math.max(1, Number(value) || 1) })}
          />
          {room.beds.map(bed => (
            <BedRow
              key={bed.id}
              bed={bed}
              onChange={nextBed =>
                updateRoom({
                  beds: room.beds.map(item => (item.id === bed.id ? nextBed : item)),
                })
              }
              onDelete={() =>
                onChangeStructure(deleteBed(structure, floorId, unitId, room.id, bed.id))
              }
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function UnitSection({
  unit,
  structure,
  floorId,
  onChangeStructure,
  expandConfig,
}: {
  unit: EditableUnit;
  structure: EditableSetupStructure;
  floorId: string | null;
  onChangeStructure: (next: EditableSetupStructure) => void;
  expandConfig: SetupStructureEditorProps['expandConfig'];
}) {
  const { t } = useTranslation();
  const openSheet = useAccommodationActionSheetStore(state => state.open);
  const [expanded, setExpanded] = useState(false);
  const counts = getUnitCounts(unit);

  function updateUnit(patch: Partial<EditableUnit>) {
    if (structure.kind === 'building_units') {
      onChangeStructure({
        ...structure,
        units: structure.units.map(item => (item.id === unit.id ? { ...item, ...patch } : item)),
      });
      return;
    }

    onChangeStructure({
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map(item => (item.id === unit.id ? { ...item, ...patch } : item)),
            }
          : floor,
      ),
    });
  }

  function openMenu() {
    openSheet(t('accommodation.setup.editor.unitActions'), [
      {
        label: t('accommodation.setup.editor.duplicate'),
        action: () => onChangeStructure(duplicateUnit(structure, floorId, unit.id)),
      },
      {
        label: t('accommodation.setup.editor.delete'),
        destructive: true,
        action: () => onChangeStructure(deleteUnit(structure, floorId, unit.id)),
      },
      {
        label: t('accommodation.setup.editor.addRoom'),
        action: () => onChangeStructure(addRoom(structure, floorId, unit.id, expandConfig)),
      },
      {
        label: t('accommodation.setup.editor.applyUnitsAll'),
        action: () => onChangeStructure(applyUnitNamingPreset(structure, 'hundreds')),
      },
      {
        label: t('accommodation.setup.editor.presetUnitsAlpha'),
        action: () => onChangeStructure(applyUnitNamingPreset(structure, 'alpha_numeric')),
      },
    ]);
  }

  return (
    <View style={styles.nestedCard}>
      <Pressable onPress={() => setExpanded(value => !value)} style={styles.entityHeader}>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
        <View style={styles.entityHeaderBody}>
          <InlineEditableTitle
            value={unit.name}
            onSave={name => updateUnit({ name, number: unit.number || name })}
          />
          <Text style={styles.countMeta}>
            {t('accommodation.setup.editor.roomsBeds', {
              rooms: counts.rooms,
              beds: counts.beds,
            })}
          </Text>
        </View>
        <EntityMenuButton onPress={openMenu} />
      </Pressable>

      {expanded ? (
        <View style={styles.entityBody}>
          <InlineEditableField
            label={t('accommodation.setup.editor.unitName')}
            value={unit.name}
            onSave={name => updateUnit({ name })}
          />
          <InlineEditableField
            label={t('accommodation.setup.editor.unitNumber')}
            value={unit.number}
            onSave={number => updateUnit({ number })}
          />
          {unit.rooms.map(room => (
            <RoomSection
              key={room.id}
              room={room}
              structure={structure}
              floorId={floorId}
              unitId={unit.id}
              onChangeStructure={onChangeStructure}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function FloorSection({
  floor,
  structure,
  onChangeStructure,
  expandConfig,
  defaultExpanded,
}: {
  floor: EditableFloor;
  structure: EditableSetupStructure;
  onChangeStructure: (next: EditableSetupStructure) => void;
  expandConfig: SetupStructureEditorProps['expandConfig'];
  defaultExpanded: boolean;
}) {
  const { t } = useTranslation();
  const openSheet = useAccommodationActionSheetStore(state => state.open);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const counts = getFloorCounts(floor, structure.kind);

  function updateFloor(patch: Partial<EditableFloor>) {
    onChangeStructure({
      ...structure,
      floors: structure.floors.map(item => (item.id === floor.id ? { ...item, ...patch } : item)),
    });
  }

  function openMenu() {
    openSheet(t('accommodation.setup.editor.floorActions'), [
      {
        label: t('accommodation.setup.editor.duplicate'),
        action: () => onChangeStructure(duplicateFloor(structure, floor.id)),
      },
      {
        label: t('accommodation.setup.editor.delete'),
        destructive: true,
        action: () => onChangeStructure(deleteFloor(structure, floor.id)),
      },
      {
        label: t('accommodation.setup.editor.addUnit'),
        action: () => onChangeStructure(addUnit(structure, floor.id, expandConfig)),
      },
      {
        label: t('accommodation.setup.editor.applyFloorsAll'),
        action: () => onChangeStructure(applyFloorNamingPreset(structure, 'numbered')),
      },
      {
        label: t('accommodation.setup.editor.presetFloorsNamed'),
        action: () => onChangeStructure(applyFloorNamingPreset(structure, 'named')),
      },
      {
        label: t('accommodation.setup.editor.applyBedsAll'),
        action: () => onChangeStructure(applyBedNamingPresetToAll(structure, 'letters')),
      },
      {
        label: t('accommodation.setup.editor.presetBedsPositional'),
        action: () => onChangeStructure(applyBedNamingPresetToAll(structure, 'positional')),
      },
      {
        label: t('accommodation.setup.editor.moveUp'),
        action: () =>
          onChangeStructure({
            ...structure,
            floors: moveItem(structure.floors, floor.id, -1),
          }),
      },
      {
        label: t('accommodation.setup.editor.moveDown'),
        action: () =>
          onChangeStructure({
            ...structure,
            floors: moveItem(structure.floors, floor.id, 1),
          }),
      },
    ]);
  }

  return (
    <View style={styles.floorCard}>
      <Pressable onPress={() => setExpanded(value => !value)} style={styles.entityHeader}>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
        <View style={styles.entityHeaderBody}>
          <InlineEditableTitle value={floor.name} onSave={name => updateFloor({ name })} />
          {!expanded ? (
            <View style={styles.countBlock}>
              {counts.units > 0 ? (
                <Text style={styles.countLine}>
                  {t('accommodation.setup.editor.unitsCount', { count: counts.units })}
                </Text>
              ) : null}
              <Text style={styles.countLine}>
                {t('accommodation.setup.editor.roomsCount', { count: counts.rooms })}
              </Text>
              <Text style={styles.countLine}>
                {t('accommodation.setup.editor.bedsCount', { count: counts.beds })}
              </Text>
            </View>
          ) : null}
        </View>
        <EntityMenuButton onPress={openMenu} />
      </Pressable>

      {expanded ? (
        <View style={styles.entityBody}>
          <InlineEditableField
            label={t('accommodation.setup.editor.floorName')}
            value={floor.name}
            onSave={name => updateFloor({ name })}
          />
          <InlineEditableField
            label={t('accommodation.setup.editor.floorNumber')}
            value={String(floor.number)}
            keyboardType="number-pad"
            onSave={value => updateFloor({ number: Math.max(1, Number(value) || 1) })}
          />
          <View style={styles.countBlock}>
            {counts.units > 0 ? (
              <Text style={styles.countLine}>
                {t('accommodation.setup.editor.unitsCount', { count: counts.units })}
              </Text>
            ) : null}
            <Text style={styles.countLine}>
              {t('accommodation.setup.editor.roomsCount', { count: counts.rooms })}
            </Text>
            <Text style={styles.countLine}>
              {t('accommodation.setup.editor.bedsCount', { count: counts.beds })}
            </Text>
          </View>

          {structure.kind === 'floors_with_units'
            ? floor.units.map(unit => (
                <UnitSection
                  key={unit.id}
                  unit={unit}
                  floorId={floor.id}
                  structure={structure}
                  onChangeStructure={onChangeStructure}
                  expandConfig={expandConfig}
                />
              ))
            : floor.rooms.map(room => (
                <RoomSection
                  key={room.id}
                  room={room}
                  structure={structure}
                  floorId={floor.id}
                  unitId={null}
                  onChangeStructure={onChangeStructure}
                />
              ))}
        </View>
      ) : null}
    </View>
  );
}

export function SetupStructureEditor({
  structure,
  onChange,
  layoutModeLabel,
  expandConfig,
}: SetupStructureEditorProps) {
  const { t } = useTranslation();
  const [showAllFloors, setShowAllFloors] = useState(false);
  const totals = useMemo(() => computeStructureTotals(structure), [structure]);

  const visibleFloors = showAllFloors
    ? structure.floors
    : structure.floors.slice(0, INITIAL_VISIBLE_FLOORS);
  const hasHiddenFloors = structure.floors.length > INITIAL_VISIBLE_FLOORS;

  return (
    <View style={styles.root}>
      {layoutModeLabel ? <Text style={styles.layoutMode}>{layoutModeLabel}</Text> : null}

      <View style={styles.buildingCard}>
        <InlineEditableTitle
          value={structure.building.name}
          onSave={name =>
            onChange({
              ...structure,
              building: { ...structure.building, name },
            })
          }
        />
        <InlineEditableField
          label={t('accommodation.fields.code')}
          value={structure.building.code}
          onSave={code =>
            onChange({
              ...structure,
              building: { ...structure.building, code },
            })
          }
        />
        {structure.kind !== 'building_units' ? (
          <InlineEditableField
            label={t('accommodation.setup.floorCount')}
            value={String(structure.floors.length)}
            keyboardType="number-pad"
            onSave={value =>
              onChange(setFloorCount(structure, Number(value) || structure.floors.length, expandConfig))
            }
          />
        ) : null}
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryRow}>
          <SummaryCard value={totals.floors} label={t('accommodation.setup.summary.floors')} />
          <SummaryCard value={totals.units} label={t('accommodation.setup.summary.units')} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard value={totals.rooms} label={t('accommodation.setup.summary.rooms')} />
          <SummaryCard value={totals.beds} label={t('accommodation.setup.summary.beds')} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('accommodation.setup.structurePreview')}</Text>

      {structure.kind === 'building_units' ? (
        <View style={styles.structureList}>
          {structure.units.map(unit => (
            <UnitSection
              key={unit.id}
              unit={unit}
              floorId={null}
              structure={structure}
              onChangeStructure={onChange}
              expandConfig={expandConfig}
            />
          ))}
        </View>
      ) : (
        <View style={styles.structureList}>
          {visibleFloors.map((floor, index) => (
            <FloorSection
              key={floor.id}
              floor={floor}
              structure={structure}
              onChangeStructure={onChange}
              expandConfig={expandConfig}
              defaultExpanded={index < INITIAL_VISIBLE_FLOORS}
            />
          ))}
          {hasHiddenFloors && !showAllFloors ? (
            <Button
              label={t('accommodation.setup.viewCompleteStructure')}
              variant="ghost"
              onPress={() => setShowAllFloors(true)}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

export { executeSetupStructure };

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  layoutMode: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  buildingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryGrid: { gap: spacing.sm },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  summaryValue: { ...typography.h2, marginBottom: spacing.xxs },
  summaryLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textSecondary,
  },
  structureList: { gap: spacing.sm },
  floorCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  nestedCard: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  entityHeaderBody: { flex: 1, gap: 4 },
  entityBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  chevron: { ...typography.body, color: colors.muted, width: 16, marginTop: 4 },
  countBlock: { gap: 2 },
  countLine: { ...typography.body, color: colors.textSecondary },
  countMeta: { ...typography.caption, color: colors.muted },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { fontSize: 18, color: colors.muted, fontWeight: '700' },
  bedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  bedTitle: { flex: 1 },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  smallBtnText: { ...typography.caption, color: colors.primary },
});
