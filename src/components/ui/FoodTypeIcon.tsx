import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { FoodType } from '../../api/types';
import { usesNonVegIcon } from '../../utils/foodType';

type FoodTypeIconProps = {
  foodType?: FoodType | null;
  size?: number;
  style?: ViewStyle;
};

const VEG_GREEN = '#008000';
const NON_VEG_RED = '#C62828';

export function FoodTypeIcon({ foodType, size = 14, style }: FoodTypeIconProps) {
  const isNonVeg = usesNonVegIcon(foodType);
  const borderColor = isNonVeg ? NON_VEG_RED : VEG_GREEN;
  const dotSize = Math.max(4, Math.round(size * 0.45));

  return (
    <View
      style={[
        styles.square,
        {
          width: size,
          height: size,
          borderColor,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={isNonVeg ? 'Non-vegetarian' : 'Vegetarian'}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: borderColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
});
