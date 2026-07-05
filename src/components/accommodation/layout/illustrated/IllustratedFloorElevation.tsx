import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { colors, spacing, typography } from '../../../../theme';
import { synthesizeStatusDots } from './layoutStatusUtils';
import { IllustratedUnitFront } from './IllustratedUnitFront';
import { getAccommodationSprite } from './spriteAssets';

const MAX_UNITS_VISIBLE = 4;

type IllustratedFloorElevationProps = {
  floorLabel: string;
  roomCount: number;
  occupied: number;
  available: number;
  bedCount: number;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function IllustratedFloorElevation({
  floorLabel,
  roomCount,
  occupied,
  available,
  bedCount,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: IllustratedFloorElevationProps) {
  const slotCount = Math.max(roomCount, 1);
  const statuses = synthesizeStatusDots({
    total: slotCount,
    occupied,
    available: available || Math.max(0, bedCount - occupied),
    maxDots: MAX_UNITS_VISIBLE,
  });

  const floorMatch = floorLabel.match(/(\d+)/);
  const floorNum = floorMatch ? Number.parseInt(floorMatch[1], 10) : 1;
  const unitBase = floorNum * 100;

  const units: { label: string; status: AccommodationStatus }[] = statuses.map(
    (status, index) => ({
      label: String(unitBase + index + 1),
      status,
    }),
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.floor,
        highlighted && styles.floorHighlight,
        pressed && styles.pressed,
      ]}>
      <View style={styles.unitsRow}>
        {units.map((unit, index) => (
          <IllustratedUnitFront
            key={`${floorLabel}-unit-${index}`}
            label={unit.label}
            status={unit.status}
          />
        ))}
        {slotCount > MAX_UNITS_VISIBLE ? (
          <View style={styles.moreBadge}>
            <Text style={styles.moreText}>+{slotCount - MAX_UNITS_VISIBLE}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.balcony}>
        <Image
          source={getAccommodationSprite('balconyRailing')}
          style={styles.railing}
          resizeMode="stretch"
        />
        <View style={styles.plantsRow}>
          {units.map((_, index) => (
            <Image
              key={`plant-${index}`}
              source={getAccommodationSprite('plantPot')}
              style={styles.plant}
              resizeMode="contain"
            />
          ))}
        </View>
      </View>

      <Text style={styles.floorLabel}>{floorLabel}</Text>
      {menu ? <View style={styles.menu}>{menu}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floor: {
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
    paddingTop: spacing.xs,
    position: 'relative',
  },
  floorHighlight: {
    backgroundColor: `${colors.primary}12`,
  },
  pressed: {
    opacity: 0.92,
  },
  unitsRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    alignItems: 'stretch',
  },
  moreBadge: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
  },
  balcony: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    gap: 2,
  },
  railing: {
    width: '100%',
    height: 12,
  },
  plantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  plant: {
    width: 18,
    height: 20,
  },
  floorLabel: {
    position: 'absolute',
    left: 6,
    top: 4,
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.muted,
  },
  menu: {
    position: 'absolute',
    right: 4,
    top: 4,
    zIndex: 2,
  },
});
