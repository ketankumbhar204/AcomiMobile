import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import type { BedSpaceListItemResponse } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import {
  floorGroupBedCount,
  type BedFloorGroup,
  type BedRoomGroup,
} from '../../utils/groupBedsByRoom';
import { BuildingInventoryRoomSection } from './BuildingInventoryRoomSection';

type BuildingInventoryFloorSectionProps = {
  group: BedFloorGroup;
  defaultExpanded?: boolean;
  pricingEditable?: boolean;
  showAddBed?: boolean;
  floorMenu?: React.ReactNode;
  renderRoomMenu?: (room: BedRoomGroup) => React.ReactNode;
  onRoomPress?: (room: BedRoomGroup) => void;
  onBedPress?: (bed: BedSpaceListItemResponse) => void;
  onAddBed?: (room: BedRoomGroup) => void;
  onCommitPricing?: (
    bed: BedSpaceListItemResponse,
    field: 'defaultRent' | 'defaultDeposit',
    value: number | null,
  ) => Promise<void>;
  renderBedMenu?: (bed: BedSpaceListItemResponse) => React.ReactNode;
  renderBedFooter?: (bed: BedSpaceListItemResponse) => React.ReactNode;
};

function BuildingInventoryFloorSectionComponent({
  group,
  defaultExpanded = true,
  pricingEditable = false,
  showAddBed = false,
  floorMenu,
  renderRoomMenu,
  onRoomPress,
  onBedPress,
  onAddBed,
  onCommitPricing,
  renderBedMenu,
  renderBedFooter,
}: BuildingInventoryFloorSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const bedCount = floorGroupBedCount(group);
  const floorTitle =
    group.floorName?.trim() ||
    t('accommodation.floors.untitled', { defaultValue: 'Floor' });
  const meta = t('accommodation.builder.floorMeta', {
    rooms: group.rooms.length,
    beds: bedCount,
    defaultValue: `${group.rooms.length} Rooms · ${bedCount} Beds`,
  });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setExpanded(prev => !prev)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <View style={styles.headerText}>
          <Text style={styles.floorName} numberOfLines={1}>
            {floorTitle}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        {floorMenu ? <View style={styles.menuSlot}>{floorMenu}</View> : null}
        {expanded ? (
          <ChevronUp size={18} color={colors.muted} strokeWidth={2.4} />
        ) : (
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
        )}
      </Pressable>

      {expanded ? (
        <View style={styles.rooms}>
          {group.rooms.map(room => (
            <BuildingInventoryRoomSection
              key={room.key}
              group={room}
              pricingEditable={pricingEditable}
              showAddBed={showAddBed}
              menu={renderRoomMenu?.(room)}
              onRoomPress={onRoomPress ? () => onRoomPress(room) : undefined}
              onBedPress={onBedPress}
              onAddBed={onAddBed ? () => onAddBed(room) : undefined}
              onCommitPricing={onCommitPricing}
              renderBedMenu={renderBedMenu}
              renderBedFooter={renderBedFooter}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const BuildingInventoryFloorSection = memo(BuildingInventoryFloorSectionComponent);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerPressed: {
    opacity: 0.88,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  floorName: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  menuSlot: {
    marginTop: -2,
  },
  rooms: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
});
