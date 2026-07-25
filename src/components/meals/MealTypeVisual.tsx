import React from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Moon, Sun, SunMedium, type LucideIcon } from 'lucide-react-native';
import type { MealType } from '../../api/types';
import { colors, radius } from '../../theme';

type MealTypeVisualProps = {
  mealType: MealType;
  size?: number;
  color?: string;
  /**
   * Optional photo for a future swap — when set, replaces the Lucide icon
   * without changing the surrounding card layout.
   */
  imageSource?: ImageSourcePropType | null;
  style?: StyleProp<ViewStyle>;
};

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sun,
  LUNCH: SunMedium,
  DINNER: Moon,
};

const MEAL_TINTs: Record<MealType, string> = {
  BREAKFAST: '#D97706',
  LUNCH: colors.primaryDark,
  DINNER: '#6366F1',
};

/**
 * Meal-type visual slot: Lucide icon today, Image later.
 * Keep the outer frame size stable so layout does not shift when photos arrive.
 */
export function MealTypeVisual({
  mealType,
  size = 22,
  color,
  imageSource,
  style,
}: MealTypeVisualProps) {
  const tint = color ?? MEAL_TINTs[mealType];
  const frame = Math.max(size + 16, 40);
  const Icon = MEAL_ICONS[mealType];

  return (
    <View
      style={[
        styles.frame,
        { width: frame, height: frame, borderRadius: radius.button, backgroundColor: `${tint}14` },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {imageSource ? (
        <Image source={imageSource} style={{ width: size + 4, height: size + 4, borderRadius: radius.sm }} />
      ) : (
        <Icon size={size} color={tint} strokeWidth={2.2} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
