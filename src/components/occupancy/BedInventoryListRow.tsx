import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedListItemResponse, SpaceType } from '../../api/types';
import { AccommodationStatusBadge } from '../accommodation/AccommodationStatusBadge';
import { BedPricingFields } from '../accommodation/BedPricingFields';
import { BuilderRowLifecycleMenu } from '../accommodation/BuilderRowLifecycleMenu';
import type { BuilderRowLifecycleMenuProps } from '../accommodation/BuilderRowLifecycleMenu';
import { InlineEditableName } from '../ui/InlineEditableName';
import { useBedOccupantLabel } from '../../hooks/useBedOccupantLabel';
import type { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { colors, radius, spacing, typography } from '../../theme';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
import { buildBedOccupancyMenuOptions } from '../../utils/bedOccupancyMenuOptions';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';
import {
  AccommodationInactiveBadge,
  accommodationInactiveCardStyle,
} from '../accommodation/AccommodationInactiveBadge';

type FlowController = ReturnType<typeof useAccommodationOccupancyFlow>;

type BedInventoryListRowProps = {
  bed: BedListItemResponse;
  spaceId: string;
  spaceType: SpaceType;
  flow: FlowController;
  buildingId: string;
  buildingName?: string;
  roomId: string;
  roomName: string;
  floorId?: string;
  unitId?: string;
  parentName?: string;
  parentType?: 'floor' | 'unit';
  currentRole?: BuilderRowLifecycleMenuProps['role'];
  canManageLifecycle?: boolean;
  canManageOccupancyActions?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  pricingEditable?: boolean;
  onCommitPricing?: (
    field: 'defaultRent' | 'defaultDeposit',
    value: number | null,
  ) => Promise<void>;
  onPress: () => void;
  lifecycleMenuProps: Omit<
    BuilderRowLifecycleMenuProps,
    'prependOptions' | 'sheetTitle' | 'forceShowTrigger'
  >;
};

export function BedInventoryListRow({
  bed,
  spaceId,
  spaceType,
  flow,
  buildingId,
  buildingName,
  roomId,
  roomName,
  floorId,
  unitId,
  parentName,
  parentType,
  canManageLifecycle = false,
  canManageOccupancyActions = false,
  editableName,
  onSaveName,
  pricingEditable = false,
  onCommitPricing,
  onPress,
  lifecycleMenuProps,
}: BedInventoryListRowProps) {
  const { t } = useTranslation();
  const inactive = !isAccommodationEntityActive(bed);
  const occupantLabel = useBedOccupantLabel(spaceId, bed.bedId, bed.status);
  const displayLabel = formatBedDisplayLabel(bed.label, t);

  const occupancyContext = useMemo(
    () => ({
      target: buildBedOccupancyTarget({
        buildingId,
        buildingName: buildingName ?? '',
        floorId,
        floorName: parentType === 'floor' ? parentName : undefined,
        unitId,
        unitName: parentType === 'unit' ? parentName : undefined,
        roomId,
        roomName,
        bedId: bed.bedId,
        bedName: displayLabel,
      }),
      accommodationStatus: bed.status,
      occupancy: null,
    }),
    [
      bed.bedId,
      buildingId,
      buildingName,
      displayLabel,
      floorId,
      parentName,
      parentType,
      roomId,
      roomName,
      unitId,
    ],
  );

  const occupancyMenuOptions = useMemo(() => {
    if (!canManageOccupancyActions || inactive) {
      return [];
    }
    return buildBedOccupancyMenuOptions(
      bed,
      spaceType,
      occupancyContext,
      flow,
      t,
      onPress,
    );
  }, [
    bed,
    canManageOccupancyActions,
    inactive,
    flow,
    occupancyContext,
    onPress,
    spaceType,
    t,
  ]);

  const showMenu = canManageLifecycle || occupancyMenuOptions.length > 0;
  const occupantText =
    bed.status === 'RESERVED' && occupantLabel
      ? t('occupancy.quickActions.reservedFor', { name: occupantLabel })
      : bed.status === 'OCCUPIED' && occupantLabel
        ? t('occupancy.quickActions.occupiedBy', { name: occupantLabel })
        : null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, inactive && accommodationInactiveCardStyle]}>
        <View style={styles.header}>
          <Pressable
            onPress={onPress}
            android_ripple={{ color: 'rgba(18, 140, 126, 0.08)' }}
            style={({ pressed }) => [styles.headerMain, pressed && styles.headerPressed]}
            accessibilityRole="button"
            accessibilityLabel={displayLabel}>
            <View style={styles.titleRow}>
              <View style={styles.titleWrap}>
                <InlineEditableName
                  value={bed.label}
                  displayValue={displayLabel}
                  editable={editableName}
                  onSave={onSaveName}
                />
              </View>
              {inactive ? (
                <AccommodationInactiveBadge />
              ) : (
                <AccommodationStatusBadge status={bed.status} />
              )}
            </View>
            {canManageOccupancyActions && !inactive && occupantText ? (
              <Text style={styles.meta} numberOfLines={1}>
                {occupantText}
              </Text>
            ) : null}
          </Pressable>
          {showMenu ? (
            <View style={styles.menuSlot}>
              <BuilderRowLifecycleMenu
                {...lifecycleMenuProps}
                isInactive={inactive}
                prependOptions={occupancyMenuOptions}
                sheetTitle={t('occupancy.bedMenu.title', {
                  bed: bed.label,
                  defaultValue: `Bed ${bed.label}`,
                })}
                forceShowTrigger
              />
            </View>
          ) : null}
        </View>
        <View style={styles.pricing}>
          <BedPricingFields
            rent={bed.defaultRent}
            deposit={bed.defaultDeposit}
            editable={pricingEditable && !inactive}
            onCommit={onCommitPricing}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerPressed: {
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  menuSlot: {
    width: 44,
    paddingTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pricing: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
