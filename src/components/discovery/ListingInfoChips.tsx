import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  CARD_INFO_KEYS,
  EXTRA_INFO_KEYS,
  MEAL_EXTRA_INFO_KEYS,
  listingInfoFlags,
  listingMealInfoFlags,
  type ListingInfoFlags,
  type ListingInfoSource,
  type MealInfoFlags,
} from '../../utils/listingInfo';
import { colors, radius, spacing, typography } from '../../theme';

type ListingInfoChipsProps = {
  listing: ListingInfoSource;
  variant: 'card' | 'detail';
  surface?: 'places' | 'meals';
};

const PLACE_LABEL_KEYS: Record<keyof ListingInfoFlags, string> = {
  contact: 'spaces.findPlace.infoContact',
  address: 'spaces.findPlace.infoAddress',
  map: 'spaces.findPlace.infoMap',
  rent: 'spaces.findPlace.infoRent',
  amenities: 'spaces.findPlace.infoAmenities',
  food: 'spaces.findPlace.infoFood',
};

const MEAL_LABEL_KEYS: Record<keyof MealInfoFlags, string> = {
  contact: 'spaces.findPlace.infoContact',
  address: 'spaces.findPlace.infoAddress',
  map: 'spaces.findPlace.infoMap',
  rent: 'spaces.findPlace.infoPrice',
  amenities: 'spaces.findPlace.infoAmenities',
  food: 'spaces.findPlace.infoFood',
  menu: 'spaces.findPlace.infoMenu',
  mealTiming: 'spaces.findPlace.infoMealTiming',
  foodType: 'spaces.findPlace.infoFoodType',
  subscription: 'spaces.findPlace.infoSubscription',
};

export function ListingInfoChips({ listing, variant, surface = 'places' }: ListingInfoChipsProps) {
  const { t } = useTranslation();
  const mealFlags = surface === 'meals' ? listingMealInfoFlags(listing) : null;
  const placeFlags = surface === 'meals' ? null : listingInfoFlags(listing);
  const flags = mealFlags ?? placeFlags;
  const compact = variant === 'card';
  if (!flags) {
    return null;
  }
  const extras = mealFlags
    ? MEAL_EXTRA_INFO_KEYS.filter(key => mealFlags[key]).map(key => ({
        key,
        available: true,
        show: true,
      }))
    : EXTRA_INFO_KEYS.filter(key => placeFlags?.[key]).map(key => ({
        key,
        available: true,
        show: true,
      }));
  const chips = [
    ...CARD_INFO_KEYS.map(key => ({
      key,
      available: flags[key],
      show: variant === 'card' || flags[key],
    })),
    ...extras,
  ].filter(item => item.show);

  if (chips.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={t('spaces.findPlace.infoAvailable')}>
      {chips.map(chip => {
        const label = t(
          surface === 'meals'
            ? MEAL_LABEL_KEYS[chip.key as keyof MealInfoFlags]
            : PLACE_LABEL_KEYS[chip.key as keyof ListingInfoFlags],
        );
        const state = t(
          chip.available
            ? 'spaces.findPlace.infoAvailableState'
            : 'spaces.findPlace.infoUnavailableState',
          { field: label },
        );
        return (
          <View
            key={chip.key}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              chip.available ? styles.chipAvailable : styles.chipMuted,
            ]}
            accessibilityLabel={state}>
            <Text
              style={[
                styles.chipText,
                compact && styles.chipTextCompact,
                chip.available ? styles.chipTextAvailable : styles.chipTextMuted,
              ]}>
              {chip.available ? '✓' : '—'} {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipAvailable: {
    backgroundColor: colors.lightGreen,
  },
  chipMuted: {
    backgroundColor: colors.surfaceSecondary,
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  chipTextAvailable: {
    color: colors.textPrimary,
  },
  chipTextMuted: {
    color: colors.muted,
  },
});
