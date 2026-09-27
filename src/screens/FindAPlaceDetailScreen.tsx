import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Info, Map, MapPin, Sparkles, UtensilsCrossed } from 'lucide-react-native';
import { getSpaceTypeLabel } from '../api';
import { spaceDiscoverApi } from '../api/spaceDiscoverApi';
import type { DiscoverSpaceDetailResponse, SpaceType } from '../api/types';
import { ApiError } from '../api/types';
import { EnquireDialog } from '../components/EnquireDialog';
import { DiscoverListingCover } from '../components/discovery/DiscoverListingCover';
import { ListingInfoChips } from '../components/discovery/ListingInfoChips';
import { StickyFormActions } from '../components/progressive';
import {
  Badge,
  EmptyState,
  Screen,
  SkeletonCard,
} from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { invalidateAccommodationQueries } from '../utils/accommodationQueryCache';
import { listingAddress } from '../utils/listingInfo';
import { firstVerifiedListingImageUrl } from '../utils/representativeImage';
import { formatCurrency } from '../utils/memberDeposit';
import {
  propertyCategoryLabelKey,
  supportsSpacePropertyCategory,
} from '../utils/spacePropertyCategory';

type Nav = NativeStackNavigationProp<MainStackParamList, 'FindAPlaceDetail'>;
type Route = RouteProp<MainStackParamList, 'FindAPlaceDetail'>;

export function FindAPlaceDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const switchSpace = useSpaceStore(state => state.switchSpace);

  const [detail, setDetail] = useState<DiscoverSpaceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [enquireOpen, setEnquireOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: detail?.name ?? t('navigation.findAPlaceDetail'),
    });
  }, [detail?.name, navigation, t, i18n.language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await spaceDiscoverApi.getDiscoverSpace(spaceId);
      setDetail(response);
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof ApiError ? err.message : t('spaces.findPlace.loadError'),
      );
    } finally {
      setLoading(false);
    }
  }, [spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openSpace = useCallback(async () => {
    if (!detail) {
      return;
    }
    setOpening(true);
    try {
      const success = await switchSpace(detail.spaceId);
      if (success) {
        invalidateAccommodationQueries();
        navigation.navigate('SpaceTabs', {
          spaceId: detail.spaceId,
          screen: 'Dashboard',
          params: { spaceId: detail.spaceId },
        });
      }
    } finally {
      setOpening(false);
    }
  }, [detail, navigation, switchSpace]);

  const onPrimaryCta = useCallback(() => {
    if (!detail) {
      return;
    }
    if (detail.alreadyMember) {
      void openSpace();
      return;
    }
    setEnquireOpen(true);
  }, [detail, openSpace]);

  const amenities =
    detail?.amenities && detail.amenities.length > 0
      ? detail.amenities
      : (detail?.amenityLabels ?? []).map((label, index) => ({
          code: detail?.amenityCodes?.[index] ?? `amenity-${index}`,
          label,
        }));
  const address = detail ? listingAddress(detail) : '';
  const startingPrice =
    detail?.startingPrice == null || detail.startingPrice === ''
      ? null
      : Number(detail.startingPrice);
  const monthlyPrice =
    detail?.monthlyPrice == null || detail.monthlyPrice === ''
      ? null
      : Number(detail.monthlyPrice);
  const mealPrice =
    detail?.mealPrice == null || detail.mealPrice === '' ? null : Number(detail.mealPrice);
  const isMess = detail?.type === 'MESS';
  const hasMonthly = monthlyPrice != null && Number.isFinite(monthlyPrice) && monthlyPrice > 0;
  const hasMeal = mealPrice != null && Number.isFinite(mealPrice) && mealPrice > 0;
  const hasStarting = startingPrice != null && Number.isFinite(startingPrice) && startingPrice > 0;
  const cta = t('spaces.findPlace.getContactDetails');

  const openMap = useCallback(() => {
    setEnquireOpen(true);
  }, []);

  const categoryLabel =
    detail?.genderPolicy && supportsSpacePropertyCategory(detail.type)
      ? t(propertyCategoryLabelKey(detail.type, detail.genderPolicy))
      : null;

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        contentStyle={styles.content}
        refreshing={loading && !!detail}
        onRefresh={() => void load()}>
        {loading && !detail ? (
          <>
            <SkeletonCard />
            <View style={styles.gap} />
            <SkeletonCard />
          </>
        ) : error && !detail ? (
          <EmptyState
            title={t('spaces.findPlace.errorTitle')}
            description={error}
          />
        ) : detail ? (
          <>
            <View style={styles.heroVisual}>
              <DiscoverListingCover
                listingId={detail.spaceId}
                spaceType={detail.type}
                listingImageUrl={firstVerifiedListingImageUrl(
                  detail.listingImageUrl,
                  detail.coverImageUrl,
                  detail.imageUrl,
                )}
                style={styles.heroImage}
                accessibilityName={detail.name}
              />
              <View style={styles.heroTypeBadge}>
                <Text style={styles.heroTypeBadgeText}>{getSpaceTypeLabel(detail.type)}</Text>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.name}>{detail.name}</Text>
              <View style={styles.addressRow}>
                <MapPin size={16} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.addressText}>
                  {address || t('spaces.findPlace.addressMissing')}
                </Text>
              </View>
              {isMess ? (
                <>
                  <Text style={styles.price}>
                    {hasMonthly && monthlyPrice != null
                      ? `${formatCurrency(monthlyPrice)} ${t('spaces.findPlace.priceSuffix.MESS')}`
                      : t('spaces.findPlace.priceOnRequest')}
                  </Text>
                  {hasMeal && mealPrice != null ? (
                    <Text style={styles.price}>
                      {`${formatCurrency(mealPrice)} ${t('spaces.findPlace.perMeal')}`}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.price}>
                  {hasStarting && startingPrice != null
                    ? `${formatCurrency(startingPrice)} ${t(`spaces.findPlace.priceSuffix.${detail.type as SpaceType}`)}`
                    : t('spaces.findPlace.priceOnRequest')}
                </Text>
              )}

              <View style={styles.metaRow}>
                {detail.alreadyMember ? (
                  <Badge label={t('spaces.findPlace.memberBadge')} />
                ) : null}
                {categoryLabel ? (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{categoryLabel}</Text>
                  </View>
                ) : null}
                {detail.foodIncludedInRent ? (
                  <View style={[styles.metaChip, styles.foodChip]}>
                    <UtensilsCrossed size={12} color={colors.primaryDark} strokeWidth={2.2} />
                    <Text style={styles.metaChipText}>{t('spaces.findPlace.foodIncluded')}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.infoPanel}>
              <Pressable
                onPress={openMap}
                style={styles.mapsPress}
                accessibilityRole="button"
                accessibilityLabel={`${t('spaces.findPlace.openMaps')}. ${cta}`}>
                <View style={styles.mapsIcon}>
                  <Map size={16} color="#0F6B4C" strokeWidth={2.2} />
                </View>
                <View style={styles.mapsCopy}>
                  <Text style={styles.mapsEyebrow}>{t('spaces.findPlace.locationSection')}</Text>
                  <Text style={styles.mapsLink}>{t('spaces.findPlace.openMaps')}</Text>
                </View>
              </Pressable>
              <View style={styles.infoHeadingRow}>
                <BadgeCheck size={14} color="#0F6B4C" strokeWidth={2.2} />
                <Text style={styles.infoHeading}>{t('spaces.findPlace.infoAvailable')}</Text>
              </View>
              <ListingInfoChips
                listing={detail}
                variant="detail"
                surface={detail.type === 'MESS' ? 'meals' : 'places'}
                onEnquire={() => setEnquireOpen(true)}
              />
            </View>

            {amenities.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('spaces.amenities.title')}</Text>
                <View style={styles.amenityWrap}>
                  {amenities.map(amenity => (
                    <View key={`${amenity.code}-${amenity.label}`} style={styles.amenityChip}>
                      <Sparkles size={12} color={colors.primaryDark} strokeWidth={2.2} />
                      <Text style={styles.amenityText} numberOfLines={1}>
                        {amenity.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {!detail.alreadyMember && !detail.ownedByCurrentUser ? (
              <View style={styles.inviteNotice}>
                <Info size={18} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.inviteNoticeText}>
                  {t('spaces.findPlace.enquire.privacyHint')}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </Screen>

      {detail ? (
        <EnquireDialog
          open={enquireOpen}
          spaceId={detail.spaceId}
          spaceName={detail.name}
          ownedByCurrentUser={Boolean(detail.ownedByCurrentUser)}
          onClose={() => setEnquireOpen(false)}
        />
      ) : null}

      {detail ? (
        <StickyFormActions
          primary={{
            label: detail.alreadyMember
              ? t('spaces.findPlace.openSpaceCta')
              : detail.ownedByCurrentUser
                ? t('spaces.findPlace.enquire.ownCta')
                : cta,
            onPress: onPrimaryCta,
            loading: opening,
            disabled: opening,
          }}
        />
      ) : error && !loading ? (
        <StickyFormActions
          primary={{
            label: t('spaces.findPlace.retry'),
            onPress: () => void load(),
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.section,
  },
  gap: {
    height: spacing.md,
  },
  heroVisual: {
    height: 220,
    borderRadius: 16,
    backgroundColor: colors.mintSubtle,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTypeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroTypeBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textPrimary,
  },
  infoBlock: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  name: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addressText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  price: {
    ...typography.h3,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  infoPanel: {
    backgroundColor: colors.mintSubtle,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  mapsPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  mapsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.lightGreen,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#0F6B4C',
  },
  infoHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  infoHeading: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#0F6B4C',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  foodChip: {
    backgroundColor: colors.lightGreen,
    borderColor: `${colors.primary}33`,
  },
  metaChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  amenityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: '100%',
  },
  amenityText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    maxWidth: 160,
  },
  inviteNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.lightGreen,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  inviteNoticeText: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
