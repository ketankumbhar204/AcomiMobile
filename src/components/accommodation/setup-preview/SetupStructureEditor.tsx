import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BedDouble,
  BedSingle,
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
import { BedPricingFields } from '../BedPricingFields';
import { useAccommodationActionSheetStore } from '../../../store/accommodationActionSheetStore';
import { colors, pastels, radius, shadows, spacing, typography } from '../../../theme';
import { formatBedDisplayLabel } from '../../../utils/formatBedDisplayLabel';
import { executeSetupStructure } from './executeSetupStructure';
import { InlineEditableField, InlineEditableTitle } from './InlineEditableTitle';
import { propagateBedPricing, setBedPricingField, type PricingField } from './setupPricingAutofill';
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

const SETUP_BED_CARD_WIDTH = 188;
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
  room: EditableRoom;
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
  if (row.room.name.trim()) {
    crumbs.push({ level: 'room', label: row.room.name.trim() });
  }
  return crumbs;
}

function flattenSetupRooms(structure: EditableSetupStructure): SetupRoomRow[] {
  const buildingName = structure.building.name.trim();
  const rows: SetupRoomRow[] = [];

  if (structure.kind === 'building_units') {
    for (const unit of structure.units) {
      for (const room of unit.rooms) {
        rows.push({
          key: room.id,
          pathSegments: [buildingName, unit.name, room.name].filter(Boolean),
          floorId: null,
          unitId: unit.id,
          floor: null,
          unit,
          room,
        });
      }
    }
    return rows;
  }

  if (structure.kind === 'floors_with_units') {
    for (const floor of structure.floors) {
      for (const unit of floor.units) {
        for (const room of unit.rooms) {
          rows.push({
            key: room.id,
            pathSegments: [buildingName, floor.name, unit.name, room.name].filter(Boolean),
            floorId: floor.id,
            unitId: unit.id,
            floor,
            unit,
            room,
          });
        }
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
  onChangeLabel,
  onCommitPricing,
  onDelete,
}: {
  bed: EditableBed;
  onChangeLabel: (label: string) => void;
  onCommitPricing: (field: PricingField, value: number | null) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const openSheet = useAccommodationActionSheetStore(state => state.open);
  const displayLabel = formatBedDisplayLabel(bed.label, t);
  const [editingLabel, setEditingLabel] = useState(false);

  return (
    <View style={styles.setupBedCard}>
      <View style={styles.setupBedHeader}>
        <View style={styles.setupBedIcon}>
          <BedSingle size={16} color={colors.success} strokeWidth={2.2} />
        </View>
        <View style={styles.setupBedTitleWrap}>
          {editingLabel ? (
            <InlineEditableField
              label={t('accommodation.setup.editor.bedLabel', { defaultValue: 'Bed label' })}
              value={bed.label}
              onSave={label => {
                onChangeLabel(label);
                setEditingLabel(false);
              }}
            />
          ) : (
            <>
              <Text style={styles.setupBedLabel} numberOfLines={2}>
                {displayLabel}
              </Text>
              <View style={styles.setupBedStatusPill}>
                <View style={styles.setupBedStatusDot} />
                <Text style={styles.setupBedStatusText}>
                  {t('accommodation.status.AVAILABLE', { defaultValue: 'Available' })}
                </Text>
              </View>
            </>
          )}
        </View>
        <Pressable
          onPress={() => setEditingLabel(true)}
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
          <Pencil size={16} color={colors.info} strokeWidth={2.4} />
        </Pressable>
      </View>
      <View style={styles.setupBedPricingWell}>
        <BedPricingFields
          rent={bed.defaultRent}
          deposit={bed.defaultDeposit}
          editable
          layout="stack"
          onCommit={async (field, value) => {
            onCommitPricing(field, value);
          }}
        />
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

/**
 * Flat room inventory card — matches View Accommodation Layout
 * (Building > Floor > Unit > Room path + horizontal bed cards).
 */
function SetupRoomInventoryCard({
  row,
  structure,
  expandConfig,
  onChangeStructure,
}: {
  row: SetupRoomRow;
  structure: EditableSetupStructure;
  expandConfig: SetupStructureEditorProps['expandConfig'];
  onChangeStructure: (next: EditableSetupStructure) => void;
}) {
  const { t } = useTranslation();
  const openSheet = useAccommodationActionSheetStore(state => state.open);
  const [inlineEdit, setInlineEdit] = useState<InlineEditTarget>(null);
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
        action: () => onChangeStructure(applyBedNamingPresetToAll(structure, 'letters')),
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.setupBedsRow}
        nestedScrollEnabled>
        {row.room.beds.map(bed => (
          <SetupBedCard
            key={bed.id}
            bed={bed}
            onChangeLabel={label =>
              onChangeStructure(
                patchRoomInStructure(structure, row.floorId, row.unitId, row.room.id, room => ({
                  ...room,
                  beds: room.beds.map(item =>
                    item.id === bed.id ? { ...item, label, number: label } : item,
                  ),
                })),
              )
            }
            onCommitPricing={(field, value) => {
              onChangeStructure(
                propagateBedPricing(
                  setBedPricingField(structure, bed.id, field, value),
                  bed.id,
                  field,
                ),
              );
            }}
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
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [buildingEditing, setBuildingEditing] = useState(false);
  const totals = useMemo(() => computeStructureTotals(structure), [structure]);
  const roomRows = useMemo(() => flattenSetupRooms(structure), [structure]);
  const visibleRooms = showAllRooms ? roomRows : roomRows.slice(0, INITIAL_VISIBLE_ROOMS);
  const hasHiddenRooms = roomRows.length > INITIAL_VISIBLE_ROOMS;
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

      <View style={styles.structureList}>
        {visibleRooms.map(row => (
          <SetupRoomInventoryCard
            key={row.key}
            row={row}
            structure={structure}
            expandConfig={expandConfig}
            onChangeStructure={onChange}
          />
        ))}
        {hasHiddenRooms && !showAllRooms ? (
          <Button
            label={t('accommodation.setup.viewCompleteStructure')}
            variant="ghost"
            onPress={() => setShowAllRooms(true)}
          />
        ) : null}
      </View>

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
    gap: spacing.md,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
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
});
