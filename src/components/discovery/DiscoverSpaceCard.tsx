import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Eye, House, MapPin, Phone, UtensilsCrossed } from 'lucide-react-native';
import { FavoriteHeartButton } from './FavoriteHeartButton';
import { useAlreadyInquired, useInquiryRecord, useInquirySentVia } from '../../hooks/useAlreadyInquired';
import { InquirySent } from './InquirySent';
import { getSpaceTypeLabel } from '../../api';
import type { DiscoverSpaceCardResponse } from '../../api/types';
import { Button } from '../ui';
import { listingAddress } from '../../utils/listingInfo';
import { formatCurrency } from '../../utils/memberDeposit';
import { listingPriceSuffix } from '../../utils/priceBasis';
import { colors, shadows, spacing, typography } from '../../theme';
import { firstVerifiedListingImageUrl } from '../../utils/representativeImage';
import { DiscoverListingCover } from './DiscoverListingCover';
import { ListingFacts } from './ListingFacts';
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
  const viewDetails = t('spaces.findPlace.viewDetails', { defaultValue: 'View Details' });
  const priceSuffix = listingPriceSuffix(t, item.type, item.priceBasis);
  const displayAmount = isMess ? (monthlyAmount ?? mealAmount) : amount;
  const displaySuffix = isMess
    ? monthlyAmount != null
      ? priceSuffix
      : mealAmount != null
        ? t('spaces.findPlace.perMeal')
        : priceSuffix
    : priceSuffix;
  const alreadyInquired = useAlreadyInquired(item.spaceId);
  const inquiry = useInquiryRecord(item.spaceId);
  const contactViewed = inquiry?.contactViewed === true;
  const sentVia = useInquirySentVia(item.spaceId);
  const viewedLabel = t('spaces.findPlace.contactDetailsViewed', {
    defaultValue: 'Contact details viewed',
  });
  return (
    <View style={styles.card}>
      <View style={styles.clip}>
      <View style={styles.media}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.mediaPress, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={item.name}>
          <View pointerEvents="none" style={styles.mediaFill}>
            <DiscoverListingCover
              listingId={item.spaceId}
              spaceType={item.type}
              listingImageUrl={firstVerifiedListingImageUrl(
                item.listingImageUrl,
                item.coverImageUrl,
                item.imageUrl,
              )}
              showRepresentativeLabel={false}
              style={styles.mediaFill}
              accessibilityName={item.name}
            />
          </View>
        </Pressable>
        <View style={styles.categoryBadge} pointerEvents="none">
          {isMess ? (
            <UtensilsCrossed size={12} color="#0F6B4C" strokeWidth={2.3} />
          ) : (
            <House size={12} color="#0F6B4C" strokeWidth={2.3} />
          )}
          <Text style={styles.categoryBadgeText} numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>
        {(alreadyInquired && !contactViewed) || item.alreadyMember ? (
          <View style={styles.imageOverlay} pointerEvents="none">
            {alreadyInquired && !contactViewed ? (
              <InquirySent variant="chip" sentVia={sentVia} />
            ) : null}
            {item.alreadyMember ? (
              <View style={styles.memberBadge}>
                <Text style={styles.memberOverlayText}>{t('spaces.findPlace.memberBadge')}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={item.name}>
          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>
        </Pressable>
        {address ? (
          <Pressable
            onPress={alreadyInquired ? undefined : onEnquire}
            disabled={alreadyInquired}
            accessibilityRole={alreadyInquired ? 'text' : 'button'}
            accessibilityLabel={alreadyInquired ? address : `${cta}: ${item.name}`}
            style={styles.addressRow}>
            <MapPin size={14} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={alreadyInquired ? onPress : onEnquire}
          accessibilityRole="button"
          accessibilityLabel={alreadyInquired ? `${viewDetails}: ${item.name}` : `${cta}: ${item.name}`}>
          <Text style={styles.price} numberOfLines={2}>
            {displayAmount != null ? (
              <>
                <Text style={styles.priceAmount}>{formatCurrency(displayAmount)}</Text>
                <Text style={styles.priceUnit}>{` ${displaySuffix}`}</Text>
              </>
            ) : (
              t('spaces.findPlace.priceOnRequest')
            )}
          </Text>
        </Pressable>
        <ListingFacts
          appearance="pills"
          genderPolicy={item.genderPolicy}
          sharingNotes={item.sharingNotes}
          foodAvailability={item.foodAvailability}
          foodIncludedInRent={item.foodIncludedInRent}
        />
        <View style={styles.infoPanel}>
          <ListingInfoChips
            listing={item}
            variant="card"
            surface={isMess ? 'meals' : 'places'}
            onViewAll={onPress}
            onEnquire={alreadyInquired ? undefined : onEnquire}
          />
        </View>
        <View style={styles.ctaRow}>
          <Button
            label={viewDetails}
            variant="secondary"
            onPress={onPress}
            numberOfLines={1}
            accessibilityLabel={`${viewDetails}: ${item.name}`}
            style={styles.viewDetails}
          />
          {contactViewed ? (
            <Button
              label={viewedLabel}
              variant="secondary"
              tint={{ bg: '#E7F6EE', border: '#8FCBAB', fg: '#0F6B4C' }}
              icon={Eye}
              onPress={onPress}
              numberOfLines={2}
              accessibilityLabel={`${viewedLabel}: ${item.name}`}
              style={styles.ctaContact}
            />
          ) : alreadyInquired ? (
            <InquirySent
              variant="button"
              sentVia={sentVia}
              email={inquiry?.sentToEmail}
              style={styles.ctaContact}
            />
          ) : (
            <Button
              label={cta}
              icon={Phone}
              onPress={onEnquire}
              numberOfLines={1}
              accessibilityLabel={`${cta}: ${item.name}`}
              style={styles.ctaContact}
            />
          )}
        </View>
      </View>
      </View>
      {/* Kept outside the clipped card so Android delivers the heart press. */}
      <View style={styles.heartSlot} collapsable={false}>
        <FavoriteHeartButton spaceId={item.spaceId} listingName={item.name} />
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
    ...shadows.sm,
  },
  clip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.96,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.mintSubtle,
    position: 'relative',
    overflow: 'hidden',
  },
  mediaPress: {
    ...StyleSheet.absoluteFillObject,
  },
  mediaFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...shadows.sm,
  },
  categoryBadgeText: {
    ...typography.caption,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#0F6B4C',
  },
  heartSlot: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  imageOverlay: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    maxWidth: '70%',
    zIndex: 2,
    alignItems: 'flex-start',
    gap: 6,
  },
  memberBadge: {
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
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 8,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addressRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    ...typography.caption,
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoPanel: {
    backgroundColor: '#F3FBF7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  price: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  viewDetails: {
    flexGrow: 0.82,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#0F6B4C',
    borderRadius: 12,
  },
  ctaContact: {
    flexGrow: 1.18,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
});
