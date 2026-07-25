import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BedDouble,
  Building2,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Grid2x2,
  Layers3,
  MoreVertical,
  Pencil,
  Tag,
} from 'lucide-react-native';
import {
  DashboardOwnerHero,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../dashboard';
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
import type {
  EditableBed,
  EditableFloor,
  EditableRoom,
  EditableSetupStructure,
  EditableUnit,
  ExpandStructureConfig,
} from './setupStructureTypes';
import { INITIAL_VISIBLE_FLOORS } from './setupPreviewUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function toggleExpanded(setter: React.Dispatch<React.SetStateAction<boolean>>) {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setter(value => !value);
}

/** Accents already used on Design A dashboard KPI / financial cards. */
const ACCENT = {
  building: '#2563EB',
  overview: colors.primaryDark,
  structure: '#D97706',
  floors: '#2563EB',
  units: '#6366F1',
  rooms: '#D97706',
  beds: colors.success,
} as const;

/** Soft hierarchy tints for Structure Preview accordion headers only. */
const HIERARCHY = {
  floor: {
    headerBg: '#FFF7E8',
    border: '#F4C46A',
    iconBg: '#FFE3B3',
    icon: '#B86B00',
  },
  unit: {
    headerBg: '#F5F0FF',
    border: '#D7C5FF',
    iconBg: '#E8DBFF',
    icon: '#7C3AED',
  },
  room: {
    headerBg: '#EDFDF4',
    border: '#BFE8CC',
    iconBg: '#D9F8E7',
    icon: '#16A34A',
  },
} as const;

export type SetupStructureEditorProps = {
  structure: EditableSetupStructure;
  onChange: (structure: EditableSetupStructure) => void;
  layoutModeLabel?: string;
  stepLabel?: string;
  expandConfig: Pick<
    ExpandStructureConfig,
    'roomsPerParent' | 'bedsPerRoom' | 'capacityPerRoom' | 'includeGroundFloor'
  >;
};

function InfoRow({
  icon: Icon,
  accent,
  label,
  value,
}: {
  icon: typeof Building2;
  accent: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: `${accent}18` }]}>
        <Icon size={16} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function HeaderIconButton({
  onPress,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      {children}
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
  const [editing, setEditing] = useState(false);
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
    <View style={[styles.roomCard, { borderColor: HIERARCHY.room.border }]}>
      <Pressable
        onPress={() => toggleExpanded(setExpanded)}
        style={[styles.entityHeader, { backgroundColor: HIERARCHY.room.headerBg }]}>
        <View style={[styles.entityIcon, { backgroundColor: HIERARCHY.room.iconBg }]}>
          <DoorOpen size={16} color={HIERARCHY.room.icon} strokeWidth={2.2} />
        </View>
        <View style={styles.entityHeaderBody}>
          <Text style={styles.entityTitle} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={styles.countMeta}>
            {t('accommodation.setup.roomSummaryLine', { beds: counts.beds })}
          </Text>
        </View>
        <HeaderIconButton
          onPress={() => {
            setEditing(true);
            if (!expanded) {
              toggleExpanded(setExpanded);
            }
          }}
          accessibilityLabel={t('accommodation.setup.editBuilding')}>
          <Pencil size={16} color={colors.muted} strokeWidth={2.2} />
        </HeaderIconButton>
        <HeaderIconButton onPress={openMenu} accessibilityLabel={t('accommodation.setup.editor.roomActions')}>
          <MoreVertical size={16} color={colors.muted} strokeWidth={2.2} />
        </HeaderIconButton>
        {expanded ? (
          <ChevronUp size={18} color={colors.muted} strokeWidth={2.2} />
        ) : (
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.2} />
        )}
      </Pressable>

      {expanded ? (
        <View style={styles.entityBody}>
          {editing ? (
            <>
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
            </>
          ) : null}
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
  const [editing, setEditing] = useState(false);
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
    <View style={[styles.unitCard, { borderColor: HIERARCHY.unit.border }]}>
      <Pressable
        onPress={() => toggleExpanded(setExpanded)}
        style={[styles.entityHeader, { backgroundColor: HIERARCHY.unit.headerBg }]}>
        <View style={[styles.entityIcon, { backgroundColor: HIERARCHY.unit.iconBg }]}>
          <Grid2x2 size={16} color={HIERARCHY.unit.icon} strokeWidth={2.2} />
        </View>
        <View style={styles.entityHeaderBody}>
          <Text style={styles.entityTitle} numberOfLines={1}>
            {unit.name}
          </Text>
          <Text style={styles.countMeta}>
            {t('accommodation.setup.unitSummaryLine', {
              rooms: counts.rooms,
              beds: counts.beds,
            })}
          </Text>
        </View>
        <HeaderIconButton
          onPress={() => {
            setEditing(true);
            if (!expanded) {
              toggleExpanded(setExpanded);
            }
          }}
          accessibilityLabel={t('accommodation.setup.editBuilding')}>
          <Pencil size={16} color={colors.muted} strokeWidth={2.2} />
        </HeaderIconButton>
        <HeaderIconButton onPress={openMenu} accessibilityLabel={t('accommodation.setup.editor.unitActions')}>
          <MoreVertical size={16} color={colors.muted} strokeWidth={2.2} />
        </HeaderIconButton>
        {expanded ? (
          <ChevronUp size={18} color={colors.muted} strokeWidth={2.2} />
        ) : (
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.2} />
        )}
      </Pressable>

      {expanded ? (
        <View style={styles.entityBody}>
          {editing ? (
            <>
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
            </>
          ) : null}
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
  const [editing, setEditing] = useState(false);
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
    <View style={[styles.floorCard, { borderColor: HIERARCHY.floor.border }]}>
      <Pressable
        onPress={() => toggleExpanded(setExpanded)}
        style={[styles.entityHeader, { backgroundColor: HIERARCHY.floor.headerBg }]}>
        <View style={[styles.entityIcon, { backgroundColor: HIERARCHY.floor.iconBg }]}>
          <Layers3 size={16} color={HIERARCHY.floor.icon} strokeWidth={2.2} />
        </View>
        <View style={styles.entityHeaderBody}>
          <Text style={styles.entityTitle} numberOfLines={1}>
            {floor.name}
          </Text>
          <Text style={styles.countMeta}>
            {counts.units > 0
              ? t('accommodation.setup.floorSummaryBadge', {
                  units: counts.units,
                  rooms: counts.rooms,
                  beds: counts.beds,
                })
              : t('accommodation.setup.floorSummaryBadgeNoUnits', {
                  rooms: counts.rooms,
                  beds: counts.beds,
                })}
          </Text>
        </View>
        <HeaderIconButton
          onPress={() => {
            setEditing(true);
            if (!expanded) {
              toggleExpanded(setExpanded);
            }
          }}
          accessibilityLabel={t('accommodation.setup.editBuilding')}>
          <Pencil size={16} color={colors.muted} strokeWidth={2.2} />
        </HeaderIconButton>
        <HeaderIconButton onPress={openMenu} accessibilityLabel={t('accommodation.setup.editor.floorActions')}>
          <MoreVertical size={16} color={colors.muted} strokeWidth={2.2} />
        </HeaderIconButton>
        {expanded ? (
          <ChevronUp size={18} color={colors.muted} strokeWidth={2.2} />
        ) : (
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.2} />
        )}
      </Pressable>

      {expanded ? (
        <View style={styles.entityBody}>
          {editing ? (
            <>
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
            </>
          ) : null}

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
  stepLabel,
  expandConfig,
}: SetupStructureEditorProps) {
  const { t } = useTranslation();
  const [showAllFloors, setShowAllFloors] = useState(false);
  const [buildingEditing, setBuildingEditing] = useState(false);
  const totals = useMemo(() => computeStructureTotals(structure), [structure]);

  const visibleFloors = showAllFloors
    ? structure.floors
    : structure.floors.slice(0, INITIAL_VISIBLE_FLOORS);
  const hasHiddenFloors = structure.floors.length > INITIAL_VISIBLE_FLOORS;
  const layoutTitle = layoutModeLabel ?? t('accommodation.setup.previewScreenTitle');

  return (
    <View style={styles.root}>
      <Text style={styles.previewTitle} accessibilityRole="header">
        {t('accommodation.setup.previewScreenTitle')}
      </Text>
      <DashboardOwnerHero
        spaceName={layoutTitle}
        spaceTypeLabel={stepLabel}
        subtitle={t('accommodation.setup.previewHeroSubtitle')}
        showGreeting={false}
        icon={Building2}
      />

      <DashboardSectionHeader
        title={t('accommodation.setup.buildingInformation')}
        icon={Building2}
        accent={ACCENT.building}
        actionLabel={t('accommodation.setup.editBuilding')}
        onAction={() => setBuildingEditing(value => !value)}
      />
      <View style={styles.buildingCard}>
        {buildingEditing ? (
          <>
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
              label={t('accommodation.setup.buildingCode')}
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
                label={t('accommodation.setup.numberOfFloors')}
                value={String(structure.floors.length)}
                keyboardType="number-pad"
                onSave={value =>
                  onChange(
                    setFloorCount(structure, Number(value) || structure.floors.length, expandConfig),
                  )
                }
              />
            ) : null}
          </>
        ) : (
          <>
            <InfoRow
              icon={Building2}
              accent={ACCENT.building}
              label={t('accommodation.setup.buildingName')}
              value={structure.building.name}
            />
            <View style={styles.infoDivider} />
            <InfoRow
              icon={Tag}
              accent={colors.primaryDark}
              label={t('accommodation.setup.buildingCode')}
              value={structure.building.code || '—'}
            />
            {structure.kind !== 'building_units' ? (
              <>
                <View style={styles.infoDivider} />
                <InfoRow
                  icon={Layers3}
                  accent={ACCENT.floors}
                  label={t('accommodation.setup.numberOfFloors')}
                  value={String(structure.floors.length)}
                />
              </>
            ) : null}
          </>
        )}
      </View>

      <DashboardSectionHeader
        title={t('accommodation.setup.propertyOverview')}
        icon={Layers3}
        accent={ACCENT.overview}
      />
      <View style={styles.summaryGrid}>
        <DashboardStatCard
          gridItem
          icon={Layers3}
          accent={ACCENT.floors}
          value={String(totals.floors)}
          label={t('accommodation.setup.summary.floors')}
        />
        <DashboardStatCard
          gridItem
          icon={Grid2x2}
          accent={ACCENT.units}
          value={String(totals.units)}
          label={t('accommodation.setup.summary.units')}
        />
        <DashboardStatCard
          gridItem
          icon={DoorOpen}
          accent={ACCENT.rooms}
          value={String(totals.rooms)}
          label={t('accommodation.setup.summary.rooms')}
        />
        <DashboardStatCard
          gridItem
          icon={BedDouble}
          accent={ACCENT.beds}
          value={String(totals.beds)}
          label={t('accommodation.setup.summary.beds')}
        />
      </View>

      <DashboardSectionHeader
        title={t('accommodation.setup.structurePreview')}
        icon={Building2}
        accent={ACCENT.structure}
      />

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
              defaultExpanded={index < 1}
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

      <Text style={styles.editHint}>{t('accommodation.setup.previewEditHint')}</Text>
    </View>
  );
}

export { executeSetupStructure };

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  previewTitle: {
    ...typography.h2,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: spacing.xs,
  },
  buildingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  infoValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 44,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  structureList: {
    gap: spacing.sm,
  },
  floorCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: HIERARCHY.floor.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  unitCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: HIERARCHY.unit.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  roomCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: HIERARCHY.room.border,
    overflow: 'hidden',
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  entityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityHeaderBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  entityTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  entityBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.white,
  },
  countMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
  },
  headerIconBtnPressed: {
    opacity: 0.7,
    backgroundColor: colors.surface,
  },
  bedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bedTitle: {
    flex: 1,
  },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  smallBtnText: {
    ...typography.caption,
    color: colors.primary,
  },
  editHint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
