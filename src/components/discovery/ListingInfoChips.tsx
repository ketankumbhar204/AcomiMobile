import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  IndianRupee,
  Leaf,
  Map,
  MapPin,
  Phone,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
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
import { colors, spacing, typography } from '../../theme';

type ListingInfoChipsProps = {
  listing: ListingInfoSource;
  variant: 'card' | 'detail';
  surface?: 'places' | 'meals';
  onEnquire?: () => void;
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

const CHIP_ICONS: Record<string, LucideIcon> = {
  contact: Phone,
  address: MapPin,
  map: Map,
  rent: IndianRupee,
  amenities: Sparkles,
  food: UtensilsCrossed,
  menu: ClipboardList,
  mealTiming: Clock3,
  foodType: Leaf,
  subscription: CalendarDays,
};

export function ListingInfoChips({ listing, variant, surface = 'places', onEnquire }: ListingInfoChipsProps) {
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
        const Icon = CHIP_ICONS[chip.key] ?? Sparkles;
        const iconSize = compact ? 12 : 14;
        const ChipWrap = onEnquire ? Pressable : View;
        return (
          <ChipWrap
            key={chip.key}
            onPress={onEnquire}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              chip.available ? styles.chipAvailable : styles.chipMuted,
            ]}
            accessibilityRole={onEnquire ? 'button' : undefined}
            accessibilityLabel={state}>
            <View
              style={[
                styles.iconWell,
                compact && styles.iconWellCompact,
                chip.available ? styles.iconWellAvailable : styles.iconWellMuted,
              ]}>
              <Icon
                size={iconSize}
                color={chip.available ? colors.success : colors.muted}
                strokeWidth={2.2}
              />
            </View>
            <Text
              style={[
                styles.chipText,
                compact && styles.chipTextCompact,
                chip.available ? styles.chipTextAvailable : styles.chipTextMuted,
              ]}>
              {label}
            </Text>
          </ChipWrap>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
  },
  chipAvailable: {
    backgroundColor: colors.white,
    borderColor: '#C6EBD7',
  },
  chipMuted: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'transparent',
  },
  iconWell: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellCompact: {
    width: 20,
    height: 20,
    borderRadius: 7,
  },
  iconWellAvailable: {
    backgroundColor: colors.lightGreen,
  },
  iconWellMuted: {
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  chipTextAvailable: {
    color: colors.textPrimary,
  },
  chipTextMuted: {
    color: colors.muted,
  },
});
