import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { UnitListItemResponse } from '../../../../api/types';
import { colors, typography } from '../../../../theme';
import { StatusDot } from '../StatusDot';
import { getAccommodationSprite } from './spriteAssets';
import { statusBorderColor, statusFacadeFill } from './layoutStatusUtils';

/** Corner unit zones on the 4-unit floor plan (percent of plan frame). */
const UNIT_QUADRANTS: StyleProp<ViewStyle>[] = [
  { top: '3%', left: '3%', width: '43%', height: '43%' },
  { top: '3%', right: '3%', width: '43%', height: '43%' },
  { bottom: '3%', left: '3%', width: '43%', height: '43%' },
  { bottom: '3%', right: '3%', width: '43%', height: '43%' },
];

type FloorPlanUnitOverlayProps = {
  unit: UnitListItemResponse;
  quadrantStyle: StyleProp<ViewStyle>;
  subtitle?: string;
  ratioLabel?: string;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

function FloorPlanUnitOverlay({
  unit,
  quadrantStyle,
  subtitle,
  ratioLabel,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: FloorPlanUnitOverlayProps) {
  const fill = statusFacadeFill(unit.status);
  const border = statusBorderColor(unit.status);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.quadrant,
        quadrantStyle,
        {
          backgroundColor: `${fill}bb`,
          borderColor: highlighted ? colors.primary : border,
        },
        pressed && styles.pressed,
      ]}>
      {menu ? <View style={styles.menu}>{menu}</View> : null}
      <Text style={styles.unitLabel} numberOfLines={1}>
        {unit.name}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      {ratioLabel ? (
        <View style={styles.ratioRow}>
          <StatusDot status={unit.status} size={8} />
          <Text style={styles.ratio}>{ratioLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type IllustratedApartmentFloorPlanProps = {
  units: UnitListItemResponse[];
  subtitleForUnit: (unit: UnitListItemResponse) => string;
  ratioForUnit: (unit: UnitListItemResponse) => string | undefined;
  searchQuery: string;
  matchesSearch: (name: string, query: string) => boolean;
  onUnitPress: (unit: UnitListItemResponse) => void;
  onUnitLongPress?: (unit: UnitListItemResponse) => void;
  renderUnitMenu?: (unit: UnitListItemResponse) => React.ReactNode;
};

export function IllustratedApartmentFloorPlan({
  units,
  subtitleForUnit,
  ratioForUnit,
  searchQuery,
  matchesSearch,
  onUnitPress,
  onUnitLongPress,
  renderUnitMenu,
}: IllustratedApartmentFloorPlanProps) {
  return (
    <View style={styles.frame}>
      <ImageBackground
        source={getAccommodationSprite('floorPlanFourUnits')}
        style={styles.planImage}
        imageStyle={styles.planImageInner}
        resizeMode="contain">
        {UNIT_QUADRANTS.map((quadrantStyle, index) => {
          const unit = units[index];
          if (!unit) {
            return null;
          }

          return (
            <FloorPlanUnitOverlay
              key={unit.unitId}
              unit={unit}
              quadrantStyle={quadrantStyle}
              subtitle={subtitleForUnit(unit)}
              ratioLabel={ratioForUnit(unit)}
              highlighted={matchesSearch(unit.name, searchQuery)}
              onPress={() => onUnitPress(unit)}
              onLongPress={
                onUnitLongPress ? () => onUnitLongPress(unit) : undefined
              }
              menu={renderUnitMenu?.(unit)}
            />
          );
        })}
      </ImageBackground>
      {units.length > 4 ? (
        <Text style={styles.more}>+{units.length - 4} more units</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignItems: 'center',
  },
  planImage: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    position: 'relative',
  },
  planImageInner: {
    width: '100%',
    height: '100%',
  },
  quadrant: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  pressed: {
    opacity: 0.88,
  },
  menu: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
  },
  unitLabel: {
    ...typography.bodyStrong,
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 9,
    color: '#444444',
    marginTop: 2,
    textAlign: 'center',
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratio: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
  },
  more: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 6,
    fontWeight: '600',
  },
});
