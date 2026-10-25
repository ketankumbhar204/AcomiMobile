import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  IndianRupee,
  Info,
  Map,
  MapPin,
  Phone,
  Sparkles,
  Check,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import {
  INFO_GRID_KEYS,
  listingInfoFlags,
  type ListingInfoFlags,
  type ListingInfoSource,
  type ListingSection,
} from '../../utils/listingInfo';
import { colors, typography } from '../../theme';

type ListingInfoChipsProps = {
  listing: ListingInfoSource;
  variant: 'card' | 'detail';
  surface?: 'places' | 'meals';
  /** Opens the matching section on the listing detail. */
  onSelect?: (section: ListingSection) => void;
  /** Opens the existing listing detail. Used by the card layout only. */
  onViewAll?: () => void;
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

export function ListingInfoChips({
  listing,
  variant,
  surface = 'places',
  onSelect,
  onViewAll,
}: ListingInfoChipsProps) {
  const { t } = useTranslation();
  const flags = listingInfoFlags(listing);

  if (variant === 'card') {
    return (
      <View accessibilityLabel={t('spaces.findPlace.availableInformation', { defaultValue: 'Available Information' })}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Info size={16} color="#0F6B4C" strokeWidth={2.2} />
            <Text style={styles.headerText} numberOfLines={1}>
              {t('spaces.findPlace.availableInformation', { defaultValue: 'Available Information' })}
            </Text>
          </View>
          {onViewAll ? (
            <Pressable
              onPress={onViewAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('spaces.findPlace.viewAllInfo', { defaultValue: 'View all' })}>
              <Text style={styles.viewAll}>
                {`${t('spaces.findPlace.viewAllInfo', { defaultValue: 'View all' })} →`}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.iconRow}>
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
            return (
              <Pressable
                key={key}
                style={styles.iconItem}
                accessibilityLabel={state}
                accessibilityRole={onSelect ? 'button' : 'text'}
                disabled={!onSelect}
                onPress={() => onSelect?.(key)}>
                <View style={[styles.iconCircle, available ? styles.iconCircleOn : styles.iconCircleOff]}>
                  <Icon
                    size={16}
                    color={available ? '#0F6B4C' : '#94A3B8'}
                    strokeWidth={2.1}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  style={[styles.iconLabel, available ? styles.iconLabelOn : styles.iconLabelOff]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

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
        const ChipWrap = onSelect ? Pressable : View;
        return (
          <ChipWrap
            key={key}
            onPress={() => onSelect?.(key)}
            style={[styles.chip, available ? styles.chipAvailable : styles.chipMuted]}
            accessibilityRole={onSelect ? 'button' : 'text'}
            accessibilityLabel={state}>
            <View style={[styles.iconWell, available ? styles.iconAvailable : styles.iconMuted]}>
              <Icon
                size={14}
                color={available ? '#059669' : '#A3ABB6'}
                strokeWidth={2.2}
              />
            </View>
            <View style={styles.amenityLabelRow}>
              {available ? (
                <Check size={12} color="#059669" strokeWidth={2.6} />
              ) : (
                <Text style={[styles.label, styles.labelMuted]}>—</Text>
              )}
              <Text
                numberOfLines={1}
                style={[styles.label, available ? styles.labelAvailable : styles.labelMuted, styles.amenityLabel]}>
                {label}
              </Text>
            </View>
          </ChipWrap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    ...typography.caption,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F6B4C',
  },
  viewAll: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F6B4C',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 2,
  },
  iconItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleOn: {
    backgroundColor: colors.white,
  },
  iconCircleOff: {
    backgroundColor: '#EEF1F4',
  },
  iconLabel: {
    ...typography.caption,
    width: '100%',
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
    textAlign: 'center',
  },
  iconLabelOn: {
    color: '#0F6B4C',
  },
  iconLabelOff: {
    color: '#94A3B8',
  },
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
  amenityLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  amenityLabel: {
    flex: 1,
  },
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
