import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BedDouble,
  Building2,
  ChevronRight,
  DoorOpen,
  Grid2x2,
  Layers3,
  Pencil,
  Plus,
  Tag,
  Users,
} from 'lucide-react-native';
import {
  DashboardOwnerHero,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../dashboard';
import { Button } from '../../ui';
import { BedCarouselChrome, BedCarouselFades } from '../BedCarouselChrome';
import {
  bedCarouselActiveDot,
  bedCarouselAtEnd,
  bedCarouselAtStart,
  bedCarouselDotCount,
  bedCarouselHasOverflow,
  bedCarouselMaxScroll,
  bedCarouselScrollTarget,
} from '../bedCarouselNav';
import { BedPricingDisplay } from '../BedPricingDisplay';
import { BedPricingFields } from '../BedPricingFields';
import { getBedIllustration } from '../layout/illustrations/illustrationAssets';
import { BedInteractionSheet } from '../BedInteractionSheet';
import { BedPricingConfirmModal } from '../BedPricingConfirmModal';
import { useAccommodationActionSheetStore } from '../../../store/accommodationActionSheetStore';
import { colors, pastels, radius, shadows, spacing, typography } from '../../../theme';
import { formatBedDisplayLabel } from '../../../utils/formatBedDisplayLabel';
import { executeSetupStructure } from './executeSetupStructure';
import { InlineEditableField, InlineEditableTitle } from './InlineEditableTitle';
import {
  applySetupBedPricing,
  previewSetupPricingImpact,
  renameSetupBed,
} from './setupPricingAutofill';
import { changedPricingFields } from '../../../utils/commitBedPricing';
import {
  hasBedPricingChange,
  isBedDraftUnchanged,
  type BedInteractionDraft,
} from '../../../utils/bedInteractionDraft';
import type { PendingBedPricing } from '../../../utils/bedPricingCommitController';
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
  setFloorCount,
} from './setupStructureMutations';
import {
  applyBedNamingPresetToAll,
  applyFloorNamingPreset,
  applyRoomNamingPresetToAll,
  applyUnitNamingPreset,
} from './setupStructureNaming';
import type {
  EditableBed,
  EditableFloor,
  EditableRoom,
  EditableSetupStructure,
  EditableUnit,
  ExpandStructureConfig,
} from './setupStructureTypes';

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

const SETUP_BED_CARD_WIDTH = 168;
const SETUP_ADD_BED_WIDTH = 128;
const INITIAL_VISIBLE_ROOMS = 6;

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

type SetupRoomRow = {
  key: string;
  pathSegments: string[];
  floorId: string | null;
  unitId: string | null;
  floor: EditableFloor | null;
  unit: EditableUnit | null;
  /** Null for a rental-style unit that has no rooms or beds. */
  room: EditableRoom | null;
};

type InlineEditTarget = 'floor' | 'unit' | 'room' | null;

type SetupPathCrumb = { level: 'building' | 'floor' | 'unit' | 'room'; label: string };

function setupPathCrumbs(row: SetupRoomRow, buildingName: string): SetupPathCrumb[] {
  const crumbs: SetupPathCrumb[] = [];
  if (buildingName.trim()) {
    crumbs.push({ level: 'building', label: buildingName.trim() });
  }
  if (row.floor?.name.trim()) {
    crumbs.push({ level: 'floor', label: row.floor.name.trim() });
  }
  if (row.unit?.name.trim()) {
    crumbs.push({ level: 'unit', label: row.unit.name.trim() });
  }
  if (row.room?.name.trim()) {
    crumbs.push({ level: 'room', label: row.room.name.trim() });
  }
  return crumbs;
}

function pushUnitRows(
  rows: SetupRoomRow[],
  buildingName: string,
  floor: EditableFloor | null,
  unit: EditableUnit,
): void {
  if (unit.rooms.length === 0) {
    rows.push({
      key: unit.id,
      pathSegments: [buildingName, floor?.name, unit.name].filter((part): part is string => Boolean(part)),
      floorId: floor?.id ?? null,
      unitId: unit.id,
      floor,
      unit,
      room: null,
    });
    return;
  }
  for (const room of unit.rooms) {
    rows.push({
      key: room.id,
      pathSegments: [buildingName, floor?.name, unit.name, room.name].filter(
        (part): part is string => Boolean(part),
      ),
      floorId: floor?.id ?? null,
      unitId: unit.id,
      floor,
      unit,
      room,
    });
  }
}

function flattenSetupRooms(structure: EditableSetupStructure): SetupRoomRow[] {
  const buildingName = structure.building.name.trim();
  const rows: SetupRoomRow[] = [];

  if (structure.kind === 'building_units') {
    for (const unit of structure.units) {
      pushUnitRows(rows, buildingName, null, unit);
    }
    return rows;
  }

  if (structure.kind === 'floors_with_units') {
    for (const floor of structure.floors) {
      for (const unit of floor.units) {
        pushUnitRows(rows, buildingName, floor, unit);
      }
    }
    return rows;
  }

  for (const floor of structure.floors) {
    for (const room of floor.rooms) {
      rows.push({
        key: room.id,
        pathSegments: [buildingName, floor.name, room.name].filter(Boolean),
        floorId: floor.id,
        unitId: null,
        floor,
        unit: null,
        room,
      });
    }
  }
  return rows;
}

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

function SetupBedCard({
  bed,
  onEdit,
  onDelete,
}: {
  bed: EditableBed;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const openSheet = useAccommodationActionSheetStore(state => state.open);
  const displayLabel = formatBedDisplayLabel(bed.label, t);

  return (
    <View style={styles.setupBedCard}>
      <View style={styles.setupBedHeader}>
        <View style={styles.setupBedIcon}>
          <Image
            source={getBedIllustration('AVAILABLE')}
            style={styles.setupBedArt}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
        <View style={styles.setupBedTitleWrap}>
          <Text style={styles.setupBedLabel} numberOfLines={2}>
            {displayLabel}
          </Text>
          <View style={styles.setupBedStatusPill}>
            <View style={styles.setupBedStatusDot} />
            <Text style={styles.setupBedStatusText}>
              {t('accommodation.status.AVAILABLE', { defaultValue: 'Available' })}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onEdit}
          onLongPress={() =>
            openSheet(displayLabel, [
              {
                label: t('accommodation.setup.editor.delete'),
                destructive: true,
                action: onDelete,
              },
            ])
          }
          style={({ pressed }) => [styles.setupBedEditBtn, pressed && styles.headerIconBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('accommodation.builder.editBed', { defaultValue: 'Edit bed' })}>
          <ChevronRight size={18} color={colors.info} strokeWidth={2.4} />
        </Pressable>
      </View>
      <View style={styles.setupBedPricingWell}>
        <BedPricingDisplay rent={bed.defaultRent} deposit={bed.defaultDeposit} layout="stack" />
      </View>
    </View>
  );
}

function SetupAddBedCard({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.setupAddBedCard, pressed && styles.headerIconBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={t('accommodation.setup.editor.addBed')}>
      <View style={styles.setupAddBedIcon}>
        <Plus size={20} color={colors.primary} strokeWidth={2.6} />
      </View>
      <Text style={styles.setupAddBedLabel}>{t('accommodation.setup.editor.addBed')}</Text>
    </Pressable>
  );
}

function patchRoomInStructure(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string | null,
  roomId: string,
  patch: Partial<EditableRoom> | ((room: EditableRoom) => EditableRoom),
): EditableSetupStructure {
  const apply = (rooms: EditableRoom[]) =>
    rooms.map(item => {
      if (item.id !== roomId) {
        return item;
      }
      return typeof patch === 'function' ? patch(item) : { ...item, ...patch };
    });

  if (structure.kind === 'building_units' && unitId) {
    return {
      ...structure,
      units: structure.units.map(unit =>
        unit.id === unitId ? { ...unit, rooms: apply(unit.rooms) } : unit,
      ),
    };
  }

  if (structure.kind === 'floors_with_units' && floorId && unitId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: apply(unit.rooms) } : unit,
              ),
            }
          : floor,
      ),
    };
  }

  if (floorId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId ? { ...floor, rooms: apply(floor.rooms) } : floor,
      ),
    };
  }

  return structure;
}

function patchFloorInStructure(
  structure: EditableSetupStructure,
  floorId: string,
  patch: Partial<EditableFloor>,
): EditableSetupStructure {
  if (structure.kind === 'building_units') {
    return structure;
  }
  return {
    ...structure,
    floors: structure.floors.map(floor =>
      floor.id === floorId ? { ...floor, ...patch } : floor,
    ),
  };
}

function listSetupUnits(structure: EditableSetupStructure): EditableUnit[] {
  if (structure.kind === 'building_units') {
    return structure.units;
  }
  return structure.floors.flatMap(floor => floor.units);
}

function sharedUnitPricing(structure: EditableSetupStructure): {
  rent: number | null;
  deposit: number | null;
  mixed: boolean;
} {
  const units = listSetupUnits(structure);
  if (units.length === 0) {
    return { rent: null, deposit: null, mixed: false };
  }
  const rent = units[0].defaultRent ?? null;
  const deposit = units[0].defaultDeposit ?? null;
  const mixed = units.some(
    unit => (unit.defaultRent ?? null) !== rent || (unit.defaultDeposit ?? null) !== deposit,
  );
  return {
    rent: mixed ? null : rent,
    deposit: mixed ? null : deposit,
    mixed,
  };
}

function applyPricingToAllUnits(
  structure: EditableSetupStructure,
  field: 'defaultRent' | 'defaultDeposit',
  value: number | null,
): EditableSetupStructure {
  const patchUnit = (unit: EditableUnit): EditableUnit => ({ ...unit, [field]: value });
  if (structure.kind === 'building_units') {
    return { ...structure, units: structure.units.map(patchUnit) };
  }
  return {
    ...structure,
    floors: structure.floors.map(floor => ({
      ...floor,
      units: floor.units.map(patchUnit),
    })),
  };
}

function patchUnitInStructure(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string,
  patch: Partial<EditableUnit>,
): EditableSetupStructure {
  if (structure.kind === 'building_units') {
    return {
      ...structure,
      units: structure.units.map(unit =>
        unit.id === unitId ? { ...unit, ...patch } : unit,
      ),
    };
  }
  if (!floorId) {
    return structure;
  }
  return {
    ...structure,
    floors: structure.floors.map(floor =>
      floor.id === floorId
        ? {
            ...floor,
            units: floor.units.map(unit =>
              unit.id === unitId ? { ...unit, ...patch } : unit,
            ),
          }
        : floor,
    ),
  };
}

function SetupUnitInventoryCard({
  row,
  structure,
  onChangeStructure,
  compact = false,
}: {
  row: SetupRoomRow;
  structure: EditableSetupStructure;
  onChangeStructure: (next: EditableSetupStructure) => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const unit = row.unit;
  const [inlineEdit, setInlineEdit] = useState(false);
  if (!unit) {
    return null;
  }

  return (
    <View style={compact ? styles.unitPreviewCard : styles.roomInventoryCard}>
      <View style={styles.roomInventoryTitleRow}>
        {compact ? null : (
          <View style={styles.pathIcon}>
            <Grid2x2 size={16} color={pastels.purple.fg} strokeWidth={2.2} />
          </View>
        )}
        <View style={styles.pathRow}>
          {compact ? (
            <Text style={styles.unitPreviewName} numberOfLines={1}>
              {unit.name}
            </Text>
          ) : (
            setupPathCrumbs(row, structure.building.name).map((crumb, index) => (
              <View key={`${crumb.level}-${crumb.label}`} style={styles.pathPart}>
                {index > 0 ? (
                  <ChevronRight
                    size={14}
                    color={colors.muted}
                    strokeWidth={2.4}
                    style={styles.pathChevron}
                  />
                ) : null}
                <Text style={index === 0 ? styles.path : styles.pathLink} numberOfLines={1}>
                  {crumb.label}
                </Text>
              </View>
            ))
          )}
        </View>
        <HeaderIconButton
          onPress={() => setInlineEdit(value => !value)}
          accessibilityLabel={t('accommodation.builder.editUnit', { defaultValue: 'Edit unit' })}>
          <Pencil size={16} color={colors.info} strokeWidth={2.4} />
        </HeaderIconButton>
      </View>
      <Text style={styles.roomTypeText}>
        {compact
          ? t('accommodation.status.AVAILABLE', { defaultValue: 'Available' })
          : t('accommodation.setup.unitOnlyLine', { defaultValue: 'Unit only — no rooms or beds' })}
      </Text>
      {compact ? (
        <Text style={styles.unitPricingLine}>
          {unit.defaultRent != null || unit.defaultDeposit != null
            ? t('accommodation.setup.unitPricingLine', {
                rent: unit.defaultRent ?? '—',
                deposit: unit.defaultDeposit ?? '—',
                defaultValue: 'Rent ₹{{rent}} · Deposit ₹{{deposit}}',
              })
            : t('accommodation.setup.unitPricingNotSet', {
                defaultValue: 'Rent and deposit optional',
              })}
        </Text>
      ) : null}
      {inlineEdit ? (
        <>
          <InlineEditableField
            label={t('accommodation.setup.editor.unitName')}
            value={unit.name}
            onSave={name => {
              onChangeStructure(patchUnitInStructure(structure, row.floorId, unit.id, { name }));
              setInlineEdit(false);
            }}
          />
          <InlineEditableField
            label={t('accommodation.setup.editor.unitNumber')}
            value={unit.number}
            onSave={number => {
              onChangeStructure(patchUnitInStructure(structure, row.floorId, unit.id, { number }));
              setInlineEdit(false);
            }}
          />
          {compact ? (
            <BedPricingFields
              editable
              layout="stack"
              rent={unit.defaultRent}
              deposit={unit.defaultDeposit}
              onCommit={(field, value) => {
                onChangeStructure(
                  patchUnitInStructure(structure, row.floorId, unit.id, { [field]: value }),
                );
              }}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/**
 * Flat room inventory card — matches View Accommodation Layout
 * (Building > Floor > Unit > Room path + horizontal bed cards).
 */
function SetupRoomInventoryCard({
  row,
  structure,
  expandConfig,
  onChangeStructure,
  onEditBed,
}: {
  row: SetupRoomRow & { room: EditableRoom };
  structure: EditableSetupStructure;
  expandConfig: SetupStructureEditorProps['expandConfig'];
  onChangeStructure: (next: EditableSetupStructure) => void;
  onEditBed: (bed: EditableBed) => void;
}) {
  const { t } = useTranslation();
  const openSheet = useAccommodationActionSheetStore(state => state.open);
  const [inlineEdit, setInlineEdit] = useState<InlineEditTarget>(null);
  const bedScrollRef = useRef<ScrollView>(null);
  const [bedScroll, setBedScroll] = useState(0);
  const [bedViewport, setBedViewport] = useState(0);
  const [bedContentWidth, setBedContentWidth] = useState(0);
  const bedCount = row.room.beds.length;
  const roomTypeLabel = t(`accommodation.roomType.${structure.roomType}`, {
    defaultValue: structure.roomType,
  });

  function openHierarchyMenu() {
    const options: Array<{
      label: string;
      action: () => void;
      destructive?: boolean;
    }> = [];

    if (row.floor) {
      options.push({
        label: t('accommodation.builder.editFloor', { defaultValue: 'Edit floor' }),
        action: () => setInlineEdit('floor'),
      });
    }
    if (row.unit) {
      options.push({
        label: t('accommodation.builder.editUnit', { defaultValue: 'Edit unit' }),
        action: () => setInlineEdit('unit'),
      });
    }
    options.push(
      {
        label: t('accommodation.builder.editRoom', { defaultValue: 'Edit room' }),
        action: () => setInlineEdit('room'),
      },
      {
        label: t('accommodation.setup.editor.duplicate'),
        action: () =>
          onChangeStructure(duplicateRoom(structure, row.floorId, row.unitId, row.room.id)),
      },
      {
        label: t('accommodation.setup.editor.addBed'),
        action: () =>
          onChangeStructure(addBed(structure, row.floorId, row.unitId, row.room.id)),
      },
      {
        label: t('accommodation.setup.editor.delete'),
        destructive: true,
        action: () =>
          onChangeStructure(deleteRoom(structure, row.floorId, row.unitId, row.room.id)),
      },
    );

    if (row.floor) {
      options.push(
        {
          label: t('accommodation.setup.editor.duplicateFloor', {
            defaultValue: 'Duplicate floor',
          }),
          action: () => onChangeStructure(duplicateFloor(structure, row.floor!.id)),
        },
        {
          label: t('accommodation.setup.editor.addUnit'),
          action: () =>
            onChangeStructure(addUnit(structure, row.floor!.id, expandConfig)),
        },
        {
          label: t('accommodation.setup.editor.deleteFloor', {
            defaultValue: 'Delete floor',
          }),
          destructive: true,
          action: () => onChangeStructure(deleteFloor(structure, row.floor!.id)),
        },
      );
    }

    if (row.unit) {
      options.push(
        {
          label: t('accommodation.setup.editor.duplicateUnit', {
            defaultValue: 'Duplicate unit',
          }),
          action: () =>
            onChangeStructure(duplicateUnit(structure, row.floorId, row.unit!.id)),
        },
        {
          label: t('accommodation.setup.editor.addRoom'),
          action: () =>
            onChangeStructure(addRoom(structure, row.floorId, row.unit!.id, expandConfig)),
        },
        {
          label: t('accommodation.setup.editor.deleteUnit', {
            defaultValue: 'Delete unit',
          }),
          destructive: true,
          action: () =>
            onChangeStructure(deleteUnit(structure, row.floorId, row.unit!.id)),
        },
      );
    }

    options.push(
      {
        label: t('accommodation.setup.editor.applyRoomsAll'),
        action: () => onChangeStructure(applyRoomNamingPresetToAll(structure, 'numbered')),
      },
      {
        label: t('accommodation.setup.editor.applyBedsAll'),
        action: () => onChangeStructure(applyBedNamingPresetToAll(structure, 'numbered')),
      },
      {
        label: t('accommodation.setup.editor.applyFloorsAll'),
        action: () => onChangeStructure(applyFloorNamingPreset(structure, 'numbered')),
      },
      {
        label: t('accommodation.setup.editor.applyUnitsAll'),
        action: () => onChangeStructure(applyUnitNamingPreset(structure, 'hundreds')),
      },
    );

    openSheet(t('accommodation.setup.editor.roomActions'), options);
  }

  return (
    <View style={styles.roomInventoryCard}>
      <View style={styles.roomInventoryHeader}>
        <View style={styles.roomInventoryTitleRow}>
          <View style={styles.pathIcon}>
            <DoorOpen size={16} color={pastels.purple.fg} strokeWidth={2.2} />
          </View>
          <View style={styles.pathRow}>
            {setupPathCrumbs(row, structure.building.name).map((crumb, index) => (
              <View key={`${crumb.level}-${crumb.label}`} style={styles.pathPart}>
                {index > 0 ? (
                  <ChevronRight
                    size={14}
                    color={colors.muted}
                    strokeWidth={2.4}
                    style={styles.pathChevron}
                  />
                ) : null}
                {crumb.level === 'building' ? (
                  <Text style={styles.path} numberOfLines={1}>
                    {crumb.label}
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => setInlineEdit(crumb.level)}
                    hitSlop={4}
                    accessibilityRole="link"
                    accessibilityLabel={crumb.label}>
                    <Text style={styles.pathLink} numberOfLines={1}>
                      {crumb.label}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
          <HeaderIconButton
            onPress={openHierarchyMenu}
            accessibilityLabel={t('accommodation.setup.editor.roomActions')}>
            <Pencil size={16} color={colors.info} strokeWidth={2.4} />
          </HeaderIconButton>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.availabilityPill}>
            <Text style={styles.availabilityText}>
              {t('accommodation.builder.bedsAvailable', {
                available: bedCount,
                total: bedCount,
                defaultValue: `${bedCount}/${bedCount} Beds Available`,
              })}
            </Text>
          </View>
          <View style={styles.roomTypeRow}>
            <Users size={12} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.roomTypeText}>
              {t('accommodation.builder.roomTypeLabel', {
                type: roomTypeLabel,
                defaultValue: `${roomTypeLabel} Room`,
              })}
            </Text>
          </View>
        </View>

        {inlineEdit === 'floor' && row.floor ? (
          <>
            <InlineEditableField
              label={t('accommodation.setup.editor.floorName')}
              value={row.floor.name}
              onSave={name => {
                onChangeStructure(patchFloorInStructure(structure, row.floor!.id, { name }));
                setInlineEdit(null);
              }}
            />
            <InlineEditableField
              label={t('accommodation.setup.editor.floorNumber')}
              value={String(row.floor.number)}
              keyboardType="number-pad"
              onSave={value => {
                onChangeStructure(
                  patchFloorInStructure(structure, row.floor!.id, {
                    number: Math.max(1, Number(value) || 1),
                  }),
                );
                setInlineEdit(null);
              }}
            />
          </>
        ) : null}

        {inlineEdit === 'unit' && row.unit ? (
          <>
            <InlineEditableField
              label={t('accommodation.setup.editor.unitName')}
              value={row.unit.name}
              onSave={name => {
                onChangeStructure(
                  patchUnitInStructure(structure, row.floorId, row.unit!.id, { name }),
                );
                setInlineEdit(null);
              }}
            />
            <InlineEditableField
              label={t('accommodation.setup.editor.unitNumber')}
              value={row.unit.number}
              onSave={number => {
                onChangeStructure(
                  patchUnitInStructure(structure, row.floorId, row.unit!.id, { number }),
                );
                setInlineEdit(null);
              }}
            />
          </>
        ) : null}

        {inlineEdit === 'room' ? (
          <>
            <InlineEditableField
              label={t('accommodation.setup.editor.roomName')}
              value={row.room.name}
              onSave={name => {
                onChangeStructure(
                  patchRoomInStructure(structure, row.floorId, row.unitId, row.room.id, {
                    name,
                  }),
                );
                setInlineEdit(null);
              }}
            />
            <InlineEditableField
              label={t('accommodation.setup.editor.roomNumber')}
              value={row.room.number}
              onSave={number => {
                onChangeStructure(
                  patchRoomInStructure(structure, row.floorId, row.unitId, row.room.id, {
                    number,
                  }),
                );
                setInlineEdit(null);
              }}
            />
          </>
        ) : null}
      </View>

      <View style={styles.setupBedsFrame}>
      <View style={styles.setupBedsScroller}>
      <ScrollView
        ref={bedScrollRef}
        horizontal
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.setupBedsRow}
        nestedScrollEnabled
        scrollEventThrottle={16}
        onLayout={event => {
          const next = Math.round(event.nativeEvent.layout.width);
          setBedViewport(prev => (prev === next ? prev : next));
        }}
        onContentSizeChange={width => {
          const next = Math.round(width);
          setBedContentWidth(prev => (prev === next ? prev : next));
        }}
        onScroll={event => {
          const next = event.nativeEvent.contentOffset.x;
          setBedScroll(prev => (Math.abs(prev - next) < 0.5 ? prev : next));
        }}>
        {row.room.beds.map(bed => (
          <SetupBedCard
            key={bed.id}
            bed={bed}
            onEdit={() => onEditBed(bed)}
            onDelete={() =>
              onChangeStructure(
                deleteBed(structure, row.floorId, row.unitId, row.room.id, bed.id),
              )
            }
          />
        ))}
        <SetupAddBedCard
          onPress={() =>
            onChangeStructure(addBed(structure, row.floorId, row.unitId, row.room.id))
          }
        />
      </ScrollView>
      <SetupBedFades
        scrollX={bedScroll}
        viewportWidth={bedViewport}
        contentWidth={bedContentWidth}
      />
      </View>
      <SetupBedCarouselChrome
        itemCount={bedCount + 1}
        stride={SETUP_BED_CARD_WIDTH + spacing.sm}
        scrollX={bedScroll}
        viewportWidth={bedViewport}
        contentWidth={bedContentWidth}
        backLabel={t('accommodation.beds.previous', { defaultValue: 'Previous beds' })}
        forwardLabel={t('accommodation.beds.next', { defaultValue: 'Next beds' })}
        onScroll={target => {
          setBedScroll(target);
          bedScrollRef.current?.scrollTo({ x: target, animated: true });
        }}
      />
      </View>
    </View>
  );
}

function SetupBedFades({
  scrollX,
  viewportWidth,
  contentWidth,
}: {
  scrollX: number;
  viewportWidth: number;
  contentWidth: number;
}) {
  const maxScroll = bedCarouselMaxScroll(contentWidth, viewportWidth);
  const overflows = bedCarouselHasOverflow(contentWidth, viewportWidth);
  return (
    <BedCarouselFades
      visible={overflows}
      showLeft={!bedCarouselAtStart(scrollX)}
      showRight={!bedCarouselAtEnd(scrollX, maxScroll)}
    />
  );
}

function SetupBedCarouselChrome({
  itemCount,
  stride,
  scrollX,
  viewportWidth,
  contentWidth,
  backLabel,
  forwardLabel,
  onScroll,
}: {
  itemCount: number;
  stride: number;
  scrollX: number;
  viewportWidth: number;
  contentWidth: number;
  backLabel: string;
  forwardLabel: string;
  onScroll: (target: number) => void;
}) {
  const maxScroll = bedCarouselMaxScroll(contentWidth, viewportWidth);
  const overflows = bedCarouselHasOverflow(contentWidth, viewportWidth);
  const dotCount = bedCarouselDotCount(itemCount, overflows);
  return (
    <BedCarouselChrome
      visible={overflows}
      canGoBack={!bedCarouselAtStart(scrollX)}
      canGoForward={!bedCarouselAtEnd(scrollX, maxScroll)}
      dotCount={dotCount}
      activeDot={bedCarouselActiveDot(scrollX, maxScroll, stride, dotCount, itemCount)}
      onBack={() => onScroll(bedCarouselScrollTarget(scrollX, -1, stride, maxScroll))}
      onForward={() => onScroll(bedCarouselScrollTarget(scrollX, 1, stride, maxScroll))}
      backLabel={backLabel}
      forwardLabel={forwardLabel}
    />
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
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [buildingEditing, setBuildingEditing] = useState(false);
  const [editingBed, setEditingBed] = useState<EditableBed | null>(null);
  const [setupPending, setSetupPending] = useState<PendingBedPricing | null>(null);
  const [setupDraft, setSetupDraft] = useState<BedInteractionDraft | null>(null);
  const [setupConfirming, setSetupConfirming] = useState(false);
  const totals = useMemo(() => computeStructureTotals(structure), [structure]);
  const roomRows = useMemo(() => flattenSetupRooms(structure), [structure]);
  const unitOnlyPreview = roomRows.length > 0 && roomRows.every(row => row.room == null);
  const unitPricing = useMemo(
    () => (unitOnlyPreview ? sharedUnitPricing(structure) : null),
    [structure, unitOnlyPreview],
  );
  const visibleRooms =
    showAllRooms || unitOnlyPreview ? roomRows : roomRows.slice(0, INITIAL_VISIBLE_ROOMS);
  const hasHiddenRooms = !unitOnlyPreview && roomRows.length > INITIAL_VISIBLE_ROOMS;
  const layoutTitle = layoutModeLabel ?? t('accommodation.setup.previewScreenTitle');

  return (
    <View style={styles.root}>
      {unitOnlyPreview ? null : (
        <Text style={styles.previewTitle} accessibilityRole="header">
          {t('accommodation.setup.previewScreenTitle')}
        </Text>
      )}
      <DashboardOwnerHero
        spaceName={unitOnlyPreview ? structure.building.name : layoutTitle}
        spaceTypeLabel={unitOnlyPreview ? (layoutModeLabel ?? stepLabel) : stepLabel}
        subtitle={
          unitOnlyPreview
            ? t('accommodation.setup.totals.units', { count: totals.units })
            : t('accommodation.setup.previewHeroSubtitle')
        }
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
        {unitOnlyPreview ? null : (
          <DashboardStatCard
            gridItem
            icon={Layers3}
            accent={ACCENT.floors}
            value={String(totals.floors)}
            label={t('accommodation.setup.summary.floors')}
          />
        )}
        <DashboardStatCard
          gridItem
          icon={Grid2x2}
          accent={ACCENT.units}
          value={String(totals.units)}
          label={t('accommodation.setup.summary.units')}
        />
        {unitOnlyPreview ? null : (
          <DashboardStatCard
            gridItem
            icon={DoorOpen}
            accent={ACCENT.rooms}
            value={String(totals.rooms)}
            label={t('accommodation.setup.summary.rooms')}
          />
        )}
        {unitOnlyPreview ? null : (
          <DashboardStatCard
            gridItem
            icon={BedDouble}
            accent={ACCENT.beds}
            value={String(totals.beds)}
            label={t('accommodation.setup.summary.beds')}
          />
        )}
      </View>

      <DashboardSectionHeader
        title={t('accommodation.setup.structurePreview')}
        icon={Building2}
        accent={ACCENT.structure}
      />

      {unitOnlyPreview && unitPricing ? (
        <View style={styles.unitPricingCard}>
          <Text style={styles.unitPricingTitle}>
            {t('accommodation.setup.unitPricingTitle', { defaultValue: 'Rent and deposit' })}
          </Text>
          <Text style={styles.unitPricingHint}>
            {unitPricing.mixed
              ? t('accommodation.setup.unitPricingMixedHint', {
                  defaultValue:
                    'Units currently have different amounts. Entering a value here updates every unit.',
                })
              : t('accommodation.setup.unitPricingOptionalHint', {
                  defaultValue:
                    'Optional. Leave blank to create the building without rent or deposit. A value here applies to every unit.',
                })}
          </Text>
          <BedPricingFields
            editable
            rent={unitPricing.rent}
            deposit={unitPricing.deposit}
            onCommit={(field, value) => {
              onChange(applyPricingToAllUnits(structure, field, value));
            }}
          />
        </View>
      ) : null}

      <Text style={styles.editHint}>{t('accommodation.setup.previewEditHint')}</Text>
      <Text style={[styles.editHint, styles.reviewInstruction]}>
        {unitOnlyPreview
          ? t('accommodation.setup.reviewUnitsBeforeCreate', {
              defaultValue: 'Review and edit your units before creating the building.',
            })
          : t('progressiveWorkflow.quickSetup.reviewPreviewHint')}
      </Text>

      <View style={unitOnlyPreview ? styles.unitGrid : styles.structureList}>
        {visibleRooms.map(row => {
          if (row.room) {
            return (
              <SetupRoomInventoryCard
                key={row.key}
                row={{ ...row, room: row.room }}
                structure={structure}
                expandConfig={expandConfig}
                onChangeStructure={onChange}
                onEditBed={setEditingBed}
              />
            );
          }
          return (
            <SetupUnitInventoryCard
              key={row.key}
              compact={unitOnlyPreview}
              row={row}
              structure={structure}
              onChangeStructure={onChange}
            />
          );
        })}
        {hasHiddenRooms && !showAllRooms ? (
          <Button
            label={t('accommodation.setup.viewCompleteStructure')}
            variant="ghost"
            onPress={() => setShowAllRooms(true)}
          />
        ) : null}
      </View>

      <BedInteractionSheet
        visible={editingBed != null}
        mode="preview"
        label={
          editingBed
            ? formatBedDisplayLabel(editingBed.label, t)
            : t('occupancy.section.bed')
        }
        bedNumber={editingBed?.label ?? ''}
        status="AVAILABLE"
        rent={editingBed?.defaultRent}
        deposit={editingBed?.defaultDeposit}
        canEditStructure
        onClose={() => {
          if (!setupConfirming) {
            setEditingBed(null);
          }
        }}
        onSave={draft => {
          if (!editingBed || isBedDraftUnchanged(
            {
              bedNumber: editingBed.label,
              rent: editingBed.defaultRent ?? null,
              deposit: editingBed.defaultDeposit ?? null,
            },
            draft,
          )) {
            return;
          }
          if (!hasBedPricingChange(
            {
              rent: editingBed.defaultRent ?? null,
              deposit: editingBed.defaultDeposit ?? null,
            },
            draft,
          )) {
            onChange(
              renameSetupBed(
                structure,
                editingBed.id,
                draft.bedNumber.trim() || editingBed.label,
              ),
            );
            setEditingBed(null);
            return;
          }
          const impact = previewSetupPricingImpact(
            structure,
            editingBed.id,
            draft.rent,
            draft.deposit,
          );
          setSetupDraft(draft);
          const changed = changedPricingFields(
            editingBed.defaultRent,
            editingBed.defaultDeposit,
            draft.rent,
            draft.deposit,
          );
          setSetupPending({
            spaceId: 'preview',
            roomId: 'preview',
            bedId: editingBed.id,
            bedLabel: formatBedDisplayLabel(draft.bedNumber || editingBed.label, t),
            changedFields: changed,
            field: changed[0] ?? 'defaultRent',
            currentRent: editingBed.defaultRent ?? null,
            currentDeposit: editingBed.defaultDeposit ?? null,
            defaultRent: draft.rent,
            defaultDeposit: draft.deposit,
            affectedBedCount: impact.affectedBedCount,
            affectedLocations: impact.affectedLocations,
          });
        }}
      />
      <BedPricingConfirmModal
        pending={setupPending}
        confirming={setupConfirming}
        onConfirm={() => {
          if (!editingBed || !setupDraft) {
            return;
          }
          setSetupConfirming(true);
          onChange(
            applySetupBedPricing(structure, editingBed.id, {
              label: setupDraft.bedNumber.trim() || editingBed.label,
              defaultRent: setupDraft.rent,
              defaultDeposit: setupDraft.deposit,
            }),
          );
          setSetupConfirming(false);
          setSetupPending(null);
          setSetupDraft(null);
          setEditingBed(null);
        }}
        onClose={() => {
          if (!setupConfirming) {
            setSetupPending(null);
            setSetupDraft(null);
          }
        }}
      />
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
    gap: spacing.md,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  unitPreviewCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  unitPreviewName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  roomInventoryCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  roomInventoryHeader: {
    gap: spacing.sm,
  },
  roomInventoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  pathIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: pastels.purple.bg,
    borderWidth: 1,
    borderColor: pastels.purple.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pathRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  pathPart: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  pathChevron: {
    marginHorizontal: 4,
  },
  path: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pathLink: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.info,
    textDecorationLine: 'underline',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 40,
  },
  availabilityPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: '#C6EBD7',
  },
  availabilityText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  roomTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomTypeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerIconBtnPressed: {
    opacity: 0.7,
  },
  setupBedsFrame: {
    width: '100%',
  },
  setupBedsScroller: {
    position: 'relative',
    width: '100%',
  },
  setupBedsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  setupBedCard: {
    width: SETUP_BED_CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  setupBedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    width: '100%',
  },
  setupBedIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  setupBedArt: {
    width: 40,
    height: 40,
  },
  setupBedTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  setupBedLabel: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  setupBedStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.success}44`,
    backgroundColor: `${colors.success}18`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setupBedStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  setupBedStatusText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  setupBedEditBtn: {
    marginTop: -2,
    marginRight: -2,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  setupBedPricingWell: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: 2,
  },
  setupAddBedCard: {
    width: SETUP_ADD_BED_WIDTH,
    minHeight: 148,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  setupAddBedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupAddBedLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  editHint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  reviewInstruction: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 0,
    marginBottom: spacing.xs,
  },
  unitPricingCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  unitPricingTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  unitPricingHint: {
    ...typography.caption,
    color: colors.muted,
  },
  unitPricingLine: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
