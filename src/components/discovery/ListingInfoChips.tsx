import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  IndianRupee,
  Map,
  MapPin,
  Phone,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import {
  INFO_GRID_KEYS,
  listingInfoFlags,
  type ListingInfoFlags,
  type ListingInfoSource,
} from '../../utils/listingInfo';
import { colors, typography } from '../../theme';

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

const CHIP_ICONS: Record<keyof ListingInfoFlags, LucideIcon> = {
  contact: Phone,
  address: MapPin,
  map: Map,
  rent: IndianRupee,
  amenities: Sparkles,
  food: UtensilsCrossed,
};

export function ListingInfoChips({ listing, surface = 'places', onEnquire }: ListingInfoChipsProps) {
  const { t } = useTranslation();
  const flags = listingInfoFlags(listing);

  return (
    <View style={styles.grid} accessibilityLabel={t('spaces.findPlace.infoAvailable')}>
      {INFO_GRID_KEYS.map(key => {
        const available = flags[key];
        const label = t(
          surface === 'meals' && key === 'rent'
            ? 'spaces.findPlace.infoPrice'
            : PLACE_LABEL_KEYS[key],
        );
        const state = t(
          available
            ? 'spaces.findPlace.infoAvailableState'
            : 'spaces.findPlace.infoUnavailableState',
          { field: label },
        );
        const Icon = CHIP_ICONS[key];
        const ChipWrap = onEnquire ? Pressable : View;
        return (
          <ChipWrap
            key={key}
            onPress={onEnquire}
            style={[styles.chip, available ? styles.chipAvailable : styles.chipMuted]}
            accessibilityRole={onEnquire ? 'button' : 'text'}
            accessibilityLabel={state}>
            <View style={[styles.iconWell, available ? styles.iconAvailable : styles.iconMuted]}>
              <Icon
                size={14}
                color={available ? '#059669' : '#A3ABB6'}
                strokeWidth={2.2}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.label, available ? styles.labelAvailable : styles.labelMuted]}>
              {`${available ? '✓' : '—'} ${label}`}
            </Text>
          </ChipWrap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipAvailable: {
    backgroundColor: '#F3FBF7',
    borderColor: '#C6EBD7',
  },
  chipMuted: {
    backgroundColor: '#F4F5F7',
    borderColor: '#E6E8EC',
  },
  iconWell: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  iconAvailable: {},
  iconMuted: {},
  label: {
    ...typography.caption,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  labelAvailable: {
    color: colors.textPrimary,
  },
  labelMuted: {
    color: '#8B95A1',
  },
});
