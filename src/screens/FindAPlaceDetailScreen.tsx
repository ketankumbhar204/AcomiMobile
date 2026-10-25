import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Info, Map as MapIcon, MapPin, Sparkles } from 'lucide-react-native';
import { getSpaceTypeLabel } from '../api';
import { enquiryApi } from '../api/enquiryApi';
import { directContactDecision, inquiryCreditsApi } from '../api/inquiryCreditsApi';
import { spaceDiscoverApi } from '../api/spaceDiscoverApi';
import type { DiscoverSpaceDetailResponse, OwnerContactResponse } from '../api/types';
import { ApiError } from '../api/types';
import { EnquireDialog } from '../components/EnquireDialog';
import { InquirySent, InquirySentDetails } from '../components/discovery/InquirySent';
import { DiscoverListingCover } from '../components/discovery/DiscoverListingCover';
import { FavoriteHeartButton } from '../components/discovery/FavoriteHeartButton';
import { OwnerContactCard } from '../components/discovery/OwnerContactCard';
import { ListingFacts, TypeChip } from '../components/discovery/ListingFacts';
import { ListingInfoChips } from '../components/discovery/ListingInfoChips';
import { StickyFormActions } from '../components/progressive';
import {
  Badge,
  EmptyState,
  Screen,
  SkeletonCard,
} from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useAlreadyInquired, useInquiryRecord, useInquirySentVia } from '../hooks/useAlreadyInquired';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { markInquired } from '../state/inquiredListings';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { invalidateAccommodationQueries } from '../utils/accommodationQueryCache';
import { listingAddress, type ListingSection } from '../utils/listingInfo';
import { openableMapsUrl } from '../utils/mapsLink';
import { firstVerifiedListingImageUrl } from '../utils/representativeImage';
import { hasActualListingPhotos } from '../utils/photoRequest';
import { PhotoRequestAction } from '../components/discovery/PhotoRequestAction';
import { formatCurrency } from '../utils/memberDeposit';
import { listingPriceSuffix } from '../utils/priceBasis';

async function startDirectContactReveal(spaceId: string): Promise<OwnerContactResponse | RevealPhase> {
  try {
    const quota = await inquiryCreditsApi.getQuota();
    if (directContactDecision(quota) !== 'reveal') {
      return directContactDecision(quota);
    }
    const created = await enquiryApi.create(spaceId, { deliveryChannel: 'VIEW_HERE' });
    markInquired(created.spaceId || spaceId, null, {
      contactViewed: true,
      sentAt: created.deliveredAt || created.requestedAt,
    });
    return created.ownerContact ?? { available: false };
  } catch (err) {
    const code = err instanceof ApiError ? err.body?.errorCode : undefined;
    if (code === 'VIEW_HERE_DISABLED') return 'disabled';
    if (code === 'VIEW_HERE_LIMIT_REACHED') return 'exhausted';
    return 'error';
  }
}

type Nav = NativeStackNavigationProp<MainStackParamList, 'FindAPlaceDetail'>;
type Route = RouteProp<MainStackParamList, 'FindAPlaceDetail'>;
type RevealPhase = 'idle' | 'checking' | 'revealing' | 'revealed' | 'disabled' | 'exhausted' | 'error';

const revealInflight = new Map<string, Promise<OwnerContactResponse | RevealPhase>>();

export function FindAPlaceDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, focusSection } = route.params;
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const sectionRefs = useRef<Partial<Record<ListingSection, View | null>>>({});
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [detail, setDetail] = useState<DiscoverSpaceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [enquireOpen, setEnquireOpen] = useState(false);
  const alreadyInquired = useAlreadyInquired(spaceId);
  const inquiry = useInquiryRecord(spaceId);
  const contactViewed = inquiry?.contactViewed === true;
  const sentVia = useInquirySentVia(spaceId);
  const [revealed, setRevealed] = useState<OwnerContactResponse | null>(null);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle');
  const [revealAttempt, setRevealAttempt] = useState(0);

  useEffect(() => {
    if (!contactViewed) {
      setRevealed(null);
      return;
    }
    let cancelled = false;
    enquiryApi.revealedContact(spaceId).then(contact => {
      if (!cancelled && contact) setRevealed(contact);
    });
    return () => {
      cancelled = true;
    };
  }, [contactViewed, spaceId]);

  useEffect(() => {
    if (!detail || !isAuthenticated || detail.alreadyMember || detail.ownedByCurrentUser) {
      return;
    }
    if (contactViewed || revealed) {
      return;
    }
    let cancelled = false;
    setRevealPhase('checking');
    const run = revealInflight.get(spaceId) ?? startDirectContactReveal(spaceId);
    revealInflight.set(spaceId, run);
    void run.then(result => {
      if (cancelled) return;
      if (result && typeof result === 'object') {
        setRevealed(result);
        setRevealPhase('revealed');
        return;
      }
      if (result === 'disabled' || result === 'exhausted' || result === 'error') {
        revealInflight.delete(spaceId);
        setRevealPhase(result);
        return;
      }
      setRevealPhase('error');
    });
    return () => {
      cancelled = true;
    };
  }, [contactViewed, detail, isAuthenticated, revealed, revealAttempt, spaceId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: detail?.name ?? t('navigation.findAPlaceDetail'),
      headerRight: () => (
        <FavoriteHeartButton spaceId={spaceId} listingName={detail?.name} />
      ),
    });
  }, [detail?.name, i18n.language, navigation, spaceId, t]);

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
    if (alreadyInquired) {
      return;
    }
    setEnquireOpen(true);
  }, [alreadyInquired, detail, openSpace]);

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
    const url = openableMapsUrl(detail?.mapUrl);
    if (!url) return;
    void Linking.openURL(url);
  }, [detail?.mapUrl]);

  const scrollToSection = useCallback((section: ListingSection) => {
    const target = sectionRefs.current[section];
    const content = contentRef.current;
    if (!target || !content) return;
    target.measureLayout(
      content,
      (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      },
      () => {},
    );
  }, []);

  useEffect(() => {
    if (!detail || !focusSection) return;
    const first = setTimeout(() => scrollToSection(focusSection), 60);
    const second = setTimeout(() => scrollToSection(focusSection), 400);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [detail, focusSection, revealed, revealPhase, scrollToSection]);

  const sectionAnchor = useCallback(
    (section: ListingSection) => (node: View | null) => {
      sectionRefs.current[section] = node;
    },
    [],
  );

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        scrollRef={scrollRef}
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
          <View ref={contentRef} collapsable={false}>
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
              {alreadyInquired ? (
                <View style={styles.heroBadgeRow}>
                  <InquirySent />
                </View>
              ) : null}
            </View>

            <View style={styles.infoBlock}>
              <View ref={sectionAnchor('food')} collapsable={false}>
              <ListingFacts
                leading={<TypeChip label={getSpaceTypeLabel(detail.type)} />}
                genderPolicy={detail.genderPolicy}
                sharingNotes={detail.sharingNotes}
                foodAvailability={detail.foodAvailability}
                foodIncludedInRent={detail.foodIncludedInRent}
              />
              </View>
              <Text style={styles.name}>{detail.name}</Text>
              {alreadyInquired ? <InquirySentDetails listingId={detail.spaceId} /> : null}
              <View ref={sectionAnchor('address')} collapsable={false}>
              {address ? (
                <View style={styles.addressRow}>
                  <MapPin size={16} color={colors.primaryDark} strokeWidth={2.2} />
                  <Text style={styles.addressText}>{address}</Text>
                </View>
              ) : null}
              </View>
              <View ref={sectionAnchor('rent')} collapsable={false}>
              {isMess ? (
                <>
                  <Text style={styles.price}>
                    {hasMonthly && monthlyPrice != null
                      ? `${formatCurrency(monthlyPrice)} ${listingPriceSuffix(t, detail.type, detail.priceBasis)}`
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
                    ? `${formatCurrency(startingPrice)} ${listingPriceSuffix(t, detail.type, detail.priceBasis)}`
                    : t('spaces.findPlace.priceOnRequest')}
                </Text>
              )}
              </View>

              {detail.alreadyMember ? (
                <View style={styles.metaRow}>
                  <Badge label={t('spaces.findPlace.memberBadge')} />
                </View>
              ) : null}
            </View>

            <View style={styles.infoPanel}>
              <View ref={sectionAnchor('map')} collapsable={false}>
              {detail.mapUrl ? (
                <Pressable
                  onPress={openMap}
                  style={styles.mapsPress}
                  accessibilityRole="button"
                  accessibilityLabel={t('spaces.findPlace.openMaps')}>
                  <View style={styles.mapsIcon}>
                    <MapIcon size={16} color="#0F6B4C" strokeWidth={2.2} />
                  </View>
                  <View style={styles.mapsCopy}>
                    <Text style={styles.mapsEyebrow}>{t('spaces.findPlace.locationSection')}</Text>
                    <Text style={styles.mapsLink}>{t('spaces.findPlace.openMaps')}</Text>
                  </View>
                </Pressable>
              ) : null}
              </View>
              <View style={styles.infoHeadingRow}>
                <BadgeCheck size={14} color="#0F6B4C" strokeWidth={2.2} />
                <Text style={styles.infoHeading}>{t('spaces.findPlace.infoAvailable')}</Text>
              </View>
              <ListingInfoChips
                listing={detail}
                variant="detail"
                surface={detail.type === 'MESS' ? 'meals' : 'places'}
                onSelect={scrollToSection}
              />
            </View>

            <View ref={sectionAnchor('amenities')} collapsable={false}>
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
            </View>

            <View style={styles.section}>
              <Text style={styles.availabilityLine}>
                <Text style={styles.availabilityLabel}>
                  {t('spaces.findPlace.reviewsRatings', { defaultValue: 'Review & Ratings' })}
                  {': '}
                </Text>
                {t('spaces.findPlace.notAvailable', { defaultValue: 'Not available' })}
              </Text>
              {hasActualListingPhotos([detail.listingImageUrl, detail.coverImageUrl, detail.imageUrl]) ? null : (
                <Text style={styles.availabilityLine}>
                  <Text style={styles.availabilityLabel}>
                    {t('spaces.findPlace.photos', { defaultValue: 'Photos' })}
                    {': '}
                  </Text>
                  {t('spaces.findPlace.notAvailable', { defaultValue: 'Not available' })}
                </Text>
              )}
              {!detail.alreadyMember && !detail.ownedByCurrentUser ? (
                <PhotoRequestAction
                  spaceId={detail.spaceId}
                  kind={detail.type === 'MESS' ? 'mess' : 'property'}
                  name={detail.name}
                  spaceType={detail.type}
                  location={listingAddress(detail)}
                  photoUrls={[detail.listingImageUrl, detail.coverImageUrl, detail.imageUrl]}
                />
              ) : null}
            </View>

            <View ref={sectionAnchor('contact')} collapsable={false} onLayout={() => {
              if (focusSection === 'contact') scrollToSection('contact');
            }}>
            {(contactViewed || revealed) && !detail.alreadyMember && !detail.ownedByCurrentUser ? (
              <View style={styles.section}>
                <Text style={styles.viewedLabel}>
                  {t('spaces.findPlace.contactDetailsViewed', { defaultValue: 'Contact details viewed' })}
                </Text>
                <OwnerContactCard contact={revealed} mapUrl={detail.mapUrl} />
              </View>
            ) : null}

            {!detail.alreadyMember && !detail.ownedByCurrentUser && !contactViewed && !revealed &&
            (revealPhase === 'disabled' || revealPhase === 'exhausted' || revealPhase === 'error') ? (
              <View style={styles.inviteNotice}>
                <Info size={18} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.inviteNoticeText}>
                  {revealPhase === 'exhausted'
                    ? t('spaces.findPlace.enquire.viewHereExhausted', {
                        defaultValue: 'You have used all instant contact views for today.',
                      })
                    : revealPhase === 'error'
                      ? t('spaces.findPlace.enquire.viewHereFailed', {
                          defaultValue: 'Contact details could not be loaded. Try again.',
                        })
                      : t('spaces.findPlace.enquire.viewHereDisabled', {
                          defaultValue: 'Instant contact viewing is turned off. You can still request details.',
                        })}
                </Text>
              </View>
            ) : null}
            </View>
          </View>
        ) : null}
      </Screen>

      {detail ? (
        <EnquireDialog
          open={enquireOpen}
          spaceId={detail.spaceId}
          spaceName={detail.name}
          ownedByCurrentUser={Boolean(detail.ownedByCurrentUser)}
          onClose={() => setEnquireOpen(false)}
          onViewedHere={contact => {
            setRevealed(contact);
            setEnquireOpen(false);
          }}
        />
      ) : null}

      {detail ? (
        (contactViewed || revealed || revealPhase === 'checking' || revealPhase === 'revealing') &&
        !alreadyInquired &&
        !detail.alreadyMember &&
        !detail.ownedByCurrentUser ? null : alreadyInquired && !detail.alreadyMember && !detail.ownedByCurrentUser ? (
          <StickyFormActions>
            <InquirySent variant="button" sentVia={sentVia} />
          </StickyFormActions>
        ) : (
          <StickyFormActions
            primary={{
              label: detail.alreadyMember
                ? t('spaces.findPlace.openSpaceCta')
                : detail.ownedByCurrentUser
                  ? t('spaces.findPlace.enquire.ownCta')
                  : revealPhase === 'error'
                    ? t('spaces.findPlace.retry', { defaultValue: 'Try again' })
                    : cta,
              onPress: revealPhase === 'error' ? () => setRevealAttempt(attempt => attempt + 1) : onPrimaryCta,
              loading: opening,
              disabled: opening,
            }}
          />
        )
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
  heroBadgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 6,
  },
  heroTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
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
  availabilityLine: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  availabilityLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
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
  viewedLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: spacing.xs,
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
