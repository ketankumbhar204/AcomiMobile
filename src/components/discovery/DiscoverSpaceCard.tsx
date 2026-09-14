import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Car,
  Cctv,
  Droplets,
  Heart,
  MapPin,
  Refrigerator,
  Shirt,
  Sparkles,
  SquareStack,
  UtensilsCrossed,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { getSpaceTypeLabel } from '../../api';
import type { DiscoverSpaceCardResponse } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';
import { discoverDefaultImageUrl } from '../../utils/discoverDefaultImages';
import { DiscoverListingImage } from './DiscoverListingImage';

const MAX_AMENITIES = 4;

const AMENITY_ICONS: Record<string, LucideIcon> = {
  WIFI: Wifi,
  FOOD_INCLUDED: UtensilsCrossed,
  WASHING_MACHINE: Shirt,
  PARKING: Car,
  HOUSEKEEPING: Sparkles,
  POWER_BACKUP: Zap,
  RO_WATER: Droplets,
  CCTV: Cctv,
  HOT_WATER: Droplets,
  REFRIGERATOR: Refrigerator,
  WARDROBE: SquareStack,
};

function amenityIcon(code: string): LucideIcon {
  return AMENITY_ICONS[code] ?? Wifi;
}

type DiscoverSpaceCardProps = {
  item: DiscoverSpaceCardResponse;
  onPress: () => void;
};

/**
 * Matches AcomiPublicWebsite PropertyCard:
 * photo cover · type badge · heart · name · location · amenity icon rows.
 * No invented ratings/prices (not in discovery API).
 */
export function DiscoverSpaceCard({ item, onPress }: DiscoverSpaceCardProps) {
  const { t } = useTranslation();
  const typeLabel = getSpaceTypeLabel(item.type);
  const address = item.address?.trim();
  const coverUri = discoverDefaultImageUrl(item.type);

  const amenityItems: { key: string; label: string; Icon: LucideIcon }[] = [];
  if (item.foodIncludedInRent) {
    amenityItems.push({
      key: 'food',
      label: t('spaces.findPlace.foodIncluded'),
      Icon: UtensilsCrossed,
    });
  }
  const codes = item.amenityCodes ?? [];
  const labels = item.amenityLabels ?? [];
  for (let i = 0; i < labels.length && amenityItems.length < MAX_AMENITIES; i += 1) {
    const label = labels[i];
    if (!label) continue;
    amenityItems.push({
      key: codes[i] ?? `label-${i}`,
      label,
      Icon: amenityIcon(codes[i] ?? ''),
    });
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.name}>
      <View style={styles.media}>
        <DiscoverListingImage
          uri={coverUri}
          style={styles.mediaFill}
          accessibilityLabel={item.name}
        />
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText} numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>
        {item.testSpace ? (
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText}>{t('spaces.findPlace.testBadge')}</Text>
          </View>
        ) : null}
        <View
          style={styles.heartWrap}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Heart size={15} color={colors.textPrimary} strokeWidth={2} />
        </View>
        {item.alreadyMember ? (
          <View style={styles.memberOverlay}>
            <Text style={styles.memberOverlayText}>{t('spaces.findPlace.memberBadge')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.addressRow}>
          <MapPin size={14} color={colors.muted} strokeWidth={2.2} />
          <Text style={styles.addressText} numberOfLines={2}>
            {address || t('spaces.findPlace.addressMissing')}
          </Text>
        </View>

        {amenityItems.length > 0 ? (
          <View style={styles.amenityRow}>
            {amenityItems.map(({ key, label, Icon }) => (
              <View key={key} style={styles.amenityItem}>
                <Icon size={14} color={colors.muted} strokeWidth={2.2} />
                <Text style={styles.amenityText} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ translateY: 1 }],
  },
  media: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.mintSubtle,
    position: 'relative',
    overflow: 'hidden',
  },
  mediaFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '70%',
  },
  typeBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textPrimary,
  },
  testBadge: {
    position: 'absolute',
    top: 44,
    left: 12,
    backgroundColor: '#FFEDD5',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  testBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#9A3412',
  },
  heartWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  memberOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberOverlayText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  amenityText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    flexShrink: 1,
  },
});
