import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin } from 'lucide-react-native';
import { getSpaceTypeLabel } from '../../api';
import type { DiscoverSpaceCardResponse, SpaceType } from '../../api/types';
import { Button } from '../ui';
import { listingAddress } from '../../utils/listingInfo';
import { formatCurrency } from '../../utils/memberDeposit';
import { colors, shadows, spacing, typography } from '../../theme';
import { firstVerifiedListingImageUrl } from '../../utils/representativeImage';
import { DiscoverListingCover } from './DiscoverListingCover';
import { ListingInfoChips } from './ListingInfoChips';

type DiscoverSpaceCardProps = {
  item: DiscoverSpaceCardResponse;
  onPress: () => void;
  onEnquire: () => void;
};

function toPositiveAmount(value?: number | string | null): number | null {
  if (value == null || value === '') {
    return null;
  }
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function priceAmount(item: DiscoverSpaceCardResponse): number | null {
  return toPositiveAmount(item.startingPrice);
}

export function DiscoverSpaceCard({ item, onPress, onEnquire }: DiscoverSpaceCardProps) {
  const { t } = useTranslation();
  const typeLabel = getSpaceTypeLabel(item.type);
  const address = listingAddress(item);
  const amount = priceAmount(item);
  const monthlyAmount = toPositiveAmount(item.monthlyPrice);
  const mealAmount = toPositiveAmount(item.mealPrice);
  const isMess = item.type === 'MESS';
  const cta = t('spaces.findPlace.getContactDetails');

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={item.name}>
        <View style={styles.media}>
          <DiscoverListingCover
            listingId={item.spaceId}
            spaceType={item.type}
            listingImageUrl={firstVerifiedListingImageUrl(
              item.listingImageUrl,
              item.coverImageUrl,
              item.imageUrl,
            )}
            style={styles.mediaFill}
            accessibilityName={item.name}
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
          {isMess ? (
            <>
              <Text style={styles.price}>
                {monthlyAmount != null
                  ? `${formatCurrency(monthlyAmount)} ${t('spaces.findPlace.priceSuffix.MESS')}`
                  : t('spaces.findPlace.priceOnRequest')}
              </Text>
              {mealAmount != null ? (
                <Text style={styles.mealPrice}>
                  {`${formatCurrency(mealAmount)} ${t('spaces.findPlace.perMeal')}`}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.price}>
              {amount != null
                ? `${formatCurrency(amount)} ${t(`spaces.findPlace.priceSuffix.${item.type as SpaceType}`)}`
                : t('spaces.findPlace.priceOnRequest')}
            </Text>
          )}
          <ListingInfoChips
            listing={item}
            variant="card"
            surface={isMess ? 'meals' : 'places'}
          />
        </View>
      </Pressable>
      <View style={styles.ctaWrap}>
        <Button
          label={cta}
          onPress={onEnquire}
          accessibilityLabel={`${cta}: ${item.name}`}
          style={styles.cta}
        />
      </View>
    </View>
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
  pressable: {
    flexGrow: 1,
    overflow: 'hidden',
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
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
  price: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  mealPrice: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ctaWrap: {
    marginTop: 'auto',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  cta: {
    minHeight: 40,
    paddingVertical: spacing.sm,
  },
});
