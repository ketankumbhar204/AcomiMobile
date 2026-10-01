import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Heart } from 'lucide-react-native';
import { useAlreadyInquired, useInquirySentVia } from '../../hooks/useAlreadyInquired';
import { InquirySent } from './InquirySent';
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
  const viewLabel = t('spaces.findPlace.view', { defaultValue: 'View' });
  const viewDetails = t('spaces.findPlace.viewDetails');
  const [stackActions, setStackActions] = useState(false);
  const alreadyInquired = useAlreadyInquired(item.spaceId);
  const sentVia = useInquirySentVia(item.spaceId);
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
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText} numberOfLines={1}>
                {typeLabel}
              </Text>
            </View>
            {alreadyInquired ? <InquirySent /> : null}
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
          {alreadyInquired ? <InquirySent variant="inline" sentVia={sentVia} /> : null}
          {address ? (
            <Text style={styles.addressText} numberOfLines={2}>
              {address}
            </Text>
          ) : null}
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
          <View style={styles.infoPanel}>
            <View style={styles.infoHeadingRow}>
              <BadgeCheck size={14} color="#0F6B4C" strokeWidth={2.2} />
              <Text style={styles.infoHeading}>{t('spaces.findPlace.infoAvailable')}</Text>
            </View>
            <ListingInfoChips
              listing={item}
              variant="card"
              surface={isMess ? 'meals' : 'places'}
              onEnquire={alreadyInquired ? undefined : onEnquire}
            />
          </View>
        </View>
      </Pressable>
      <View
        style={[styles.ctaWrap, stackActions ? styles.ctaStack : styles.ctaRow]}
        onLayout={event => {
          const next = event.nativeEvent.layout.width < 260;
          setStackActions(current => (current === next ? current : next));
        }}>
        <Button
          label={viewLabel}
          variant="secondary"
          onPress={onPress}
          numberOfLines={1}
          accessibilityLabel={`${viewDetails}: ${item.name}`}
          style={stackActions ? styles.ctaFull : styles.ctaView}
        />
        {alreadyInquired ? (
          <InquirySent
            variant="button"
            sentVia={sentVia}
            style={stackActions ? styles.ctaFull : styles.ctaContact}
          />
        ) : (
          <Button
            label={cta}
            onPress={onEnquire}
            numberOfLines={1}
            accessibilityLabel={`${cta}: ${item.name}`}
            style={stackActions ? styles.ctaFull : styles.ctaContact}
          />
        )}
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
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 52,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 6,
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
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
  addressText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoPanel: {
    backgroundColor: colors.mintSubtle,
    borderRadius: 16,
    padding: 10,
    gap: 8,
  },
  mapsRow: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapsRowMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  mapsPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  mapsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapsIconMuted: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapsCopy: {
    flex: 1,
    minWidth: 0,
  },
  mapsEyebrow: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  mapsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mapsLink: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F6B4C',
  },
  mapsMuted: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  infoHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  infoHeading: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#0F6B4C',
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
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  ctaStack: {
    flexDirection: 'column',
  },
  ctaView: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
  },
  ctaContact: {
    flexGrow: 1,
    flexShrink: 0,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
  },
  ctaFull: {
    width: '100%',
    minHeight: 40,
    paddingVertical: spacing.sm,
  },
});
