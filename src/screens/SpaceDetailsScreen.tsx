import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CalendarDays,
  History as HistoryIcon,
  MapPin,
  Phone,
  Settings2,
  Share2,
  Sparkles,
  SquarePen,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { getSpaceTypeLabel } from '../api';
import type { Space } from '../api/types';
import { HeaderBackButton, Screen, Skeleton } from '../components/ui';
import { Timeline, type TimelineGroup, type TimelineItem } from '../components/ui/Timeline';
import { DashboardStatCard } from '../components/dashboard/shared/DashboardStatCard';
import { SpaceStatusChip } from '../components/spaces/SpaceStatusChip';
import { useDeactivateSpace } from '../hooks/useDeactivateSpace';
import { useAuthenticatedUserId } from '../hooks/useAuth';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { isSpaceOwner } from '../utils/spaceOwnership';
import { formatCurrency } from '../utils/memberDeposit';
import { peekDashboardSummary } from '../utils/dashboardQueryCache';
import { getSpaceTypeAccent, getSpaceTypeIcon } from '../utils/spaceVisuals';

type SpaceDetailsNav = NativeStackNavigationProp<
  MainStackParamList,
  'SpaceDetails'
>;
type SpaceDetailsRoute = NativeStackScreenProps<
  MainStackParamList,
  'SpaceDetails'
>['route'];

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function InfoRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: `${accent}14` }]}>
        <Icon size={16} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function QuickAction({
  icon: Icon,
  label,
  accent,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${accent}14` }]}>
        <Icon size={20} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: LucideIcon;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionHeaderIcon, { backgroundColor: `${accent}14` }]}>
          <Icon size={15} color={accent} strokeWidth={2.2} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function SpaceDetailsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SpaceDetailsNav>();
  const route = useRoute<SpaceDetailsRoute>();
  const { spaceId } = route.params;
  const currentUserId = useAuthenticatedUserId();
  const { confirmDeactivate, isLoading } = useDeactivateSpace();

  const loadSpaceDetails = useSpaceStore(state => state.loadSpaceDetails);
  const storeSpace = useSpaceStore(state => state.selectedSpace);
  const error = useSpaceStore(state => state.error);

  const [space, setSpace] = useState<Space | null>(
    storeSpace?.id === spaceId ? storeSpace : null,
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.spaceDetails'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadSpaceDetails(spaceId).then(loaded => {
        if (isActive && loaded) {
          setSpace(loaded);
        }
      });
      return () => {
        isActive = false;
      };
    }, [loadSpaceDetails, spaceId]),
  );

  const owner = isSpaceOwner(space, currentUserId);
  const accent = space ? getSpaceTypeAccent(space.type) : colors.primaryDark;
  const TypeIcon = space ? getSpaceTypeIcon(space.type) : Settings2;

  const summary = useMemo(
    () => (space ? peekDashboardSummary(spaceId) : null),
    [space, spaceId],
  );

  const kpis = useMemo(() => {
    if (!summary) {
      return [];
    }
    const items: { label: string; value: string }[] = [];
    const acc = summary.accommodationOperations;
    const mess = summary.messOperations;
    const fin = summary.financial;

    if (acc) {
      items.push({
        label: t('spaces.details.kpi.occupiedBeds', { defaultValue: 'Occupied beds' }),
        value: String(acc.occupiedBeds),
      });
      items.push({
        label: t('spaces.details.kpi.vacantBeds', { defaultValue: 'Vacant beds' }),
        value: String(acc.vacantBeds),
      });
    }
    if (mess) {
      items.push({
        label: t('spaces.details.kpi.mealMembers', { defaultValue: 'Meal members' }),
        value: String(mess.membersReceivingMeals),
      });
      items.push({
        label: t('spaces.details.kpi.openPolls', { defaultValue: 'Open polls' }),
        value: String(mess.openPollsCount),
      });
    }
    if (fin) {
      if (fin.collected != null) {
        items.push({
          label: t('spaces.details.kpi.collected', { defaultValue: 'Collected' }),
          value: formatCurrency(fin.collected),
        });
      }
      if (fin.pending != null) {
        items.push({
          label: t('spaces.details.kpi.pending', { defaultValue: 'Pending' }),
          value: formatCurrency(fin.pending),
        });
      }
    }
    return items;
  }, [summary, t]);

  const activityGroups = useMemo<TimelineGroup[]>(() => {
    if (!space) {
      return [];
    }
    const items: TimelineItem[] = [
      {
        id: 'created',
        title: t('spaces.details.activity.created', { defaultValue: 'Space created' }),
        meta: formatDate(space.createdAt),
        accent: colors.primary,
        icon: Sparkles,
      },
    ];
    if (space.updatedAt && space.updatedAt !== space.createdAt) {
      items.unshift({
        id: 'updated',
        title: t('spaces.details.activity.updated', { defaultValue: 'Details updated' }),
        meta: formatDate(space.updatedAt),
        accent: accent,
        icon: SquarePen,
      });
    }
    return [{ key: 'activity', label: t('spaces.details.activity.title', { defaultValue: 'Activity' }), items }];
  }, [accent, space, t]);

  const onShare = useCallback(() => {
    if (!space) {
      return;
    }
    const parts = [space.name, getSpaceTypeLabel(space.type), space.address ?? '']
      .filter(Boolean)
      .join('\n');
    void Share.share({ message: parts, title: space.name });
  }, [space]);

  if (!space && !error) {
    return (
      <Screen contentStyle={styles.content}>
        <View style={styles.heroSkeleton}>
          <Skeleton width={56} height={56} borderRadius={18} />
          <View style={styles.heroSkeletonText}>
            <Skeleton width={'70%'} height={22} />
            <Skeleton width={'45%'} height={14} />
          </View>
        </View>
        <View style={styles.kpiRow}>
          <Skeleton width={'47%'} height={78} borderRadius={radius.card} />
          <Skeleton width={'47%'} height={78} borderRadius={radius.card} />
        </View>
        <Skeleton width={'100%'} height={140} borderRadius={radius.card} />
      </Screen>
    );
  }

  if (!space) {
    return (
      <Screen contentStyle={styles.content}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error ?? t('spaces.errors.notFound')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentStyle={styles.flexContent}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: `${accent}0F`, borderColor: `${accent}33` }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { borderColor: `${accent}33` }]}>
              <TypeIcon size={26} color={accent} strokeWidth={2.2} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroType, { color: accent }]}>
                {getSpaceTypeLabel(space.type)}
              </Text>
              <Text style={styles.heroName} numberOfLines={2}>
                {space.name}
              </Text>
              <SpaceStatusChip
                label={
                  space.isActive
                    ? t('spaces.details.statusActive', { defaultValue: 'Active' })
                    : t('spaces.details.statusInactive', { defaultValue: 'Inactive' })
                }
                tone={space.isActive ? 'active' : 'inactive'}
              />
            </View>
          </View>
          {space.address ? (
            <View style={styles.heroAddress}>
              <MapPin size={14} color={accent} strokeWidth={2.2} />
              <Text style={styles.heroAddressText} numberOfLines={2}>
                {space.address}
              </Text>
            </View>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {owner ? (
            <QuickAction
              icon={SquarePen}
              label={t('common.edit')}
              accent={accent}
              onPress={() => navigation.navigate('EditSpace', { spaceId })}
            />
          ) : null}
          <QuickAction
            icon={Bell}
            label={t('notifications.title')}
            accent={accent}
            onPress={() => navigation.navigate('SpaceNotifications', { spaceId })}
          />
          <QuickAction
            icon={Share2}
            label={t('spaces.details.share', { defaultValue: 'Share' })}
            accent={accent}
            onPress={onShare}
          />
        </View>

        {/* KPI strip */}
        {kpis.length > 0 ? (
          <View style={styles.kpiRow}>
            {kpis.map(kpi => (
              <DashboardStatCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                accent={accent}
                gridItem
              />
            ))}
          </View>
        ) : null}

        {/* General information */}
        <SectionCard
          icon={Settings2}
          title={t('spaces.details.generalInfo', { defaultValue: 'General information' })}
          accent={accent}>
          <InfoRow
            icon={TypeIcon}
            label={t('spaces.details.type')}
            value={getSpaceTypeLabel(space.type)}
            accent={accent}
          />
          <InfoRow
            icon={CalendarDays}
            label={t('spaces.details.createdAt')}
            value={formatDate(space.createdAt)}
            accent={accent}
          />
        </SectionCard>

        {/* Amenities */}
        {space.amenities && space.amenities.length > 0 ? (
          <SectionCard
            icon={Sparkles}
            title={t('spaces.amenities.title')}
            accent={accent}>
            <View style={styles.amenityWrap}>
              {space.amenities.map(amenity => (
                <View
                  key={`${amenity.code}-${amenity.label}`}
                  style={[styles.amenityChip, { borderColor: `${accent}33`, backgroundColor: `${accent}0D` }]}>
                  <Sparkles size={12} color={accent} strokeWidth={2.2} />
                  <Text style={[styles.amenityText, { color: accent }]} numberOfLines={1}>
                    {amenity.label}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}

        {/* Contact information */}
        <SectionCard
          icon={Phone}
          title={t('spaces.details.contactInfo', { defaultValue: 'Contact information' })}
          accent={accent}>
          <InfoRow
            icon={Phone}
            label={t('spaces.details.contact')}
            value={space.contactNumber ?? t('spaces.details.notProvided')}
            accent={accent}
          />
          <InfoRow
            icon={MapPin}
            label={t('spaces.details.address')}
            value={space.address ?? t('spaces.details.notProvided')}
            accent={accent}
          />
        </SectionCard>

        {/* Billing (mess) */}
        {space.type === 'MESS' && space.mealBillingType ? (
          <SectionCard
            icon={UtensilsCrossed}
            title={t('spaces.mealBilling.title')}
            accent={accent}>
            <InfoRow
              icon={UtensilsCrossed}
              label={t('spaces.mealBilling.title')}
              value={t(`spaces.mealBilling.types.${space.mealBillingType}.label`, {
                defaultValue: space.mealBillingType,
              })}
              accent={accent}
            />
          </SectionCard>
        ) : null}

        {/* Recent activity */}
        {activityGroups.length > 0 ? (
          <SectionCard
            icon={HistoryIcon}
            title={t('spaces.details.activity.title', { defaultValue: 'Activity' })}
            accent={accent}>
            <Timeline groups={activityGroups} />
          </SectionCard>
        ) : null}

        {/* Danger zone */}
        {owner ? (
          <Pressable
            onPress={() => confirmDeactivate(spaceId, space.name)}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.deactivate,
              pressed && styles.deactivatePressed,
              isLoading && styles.deactivateDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('spaces.details.deactivate')}>
            <Trash2 size={16} color="#DC2626" strokeWidth={2.2} />
            <Text style={styles.deactivateText}>{t('spaces.details.deactivate')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  flexContent: {
    flex: 1,
    padding: 0,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  heroType: {
    ...typography.eyebrow,
  },
  heroName: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
  },
  heroAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroAddressText: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 76,
    justifyContent: 'center',
    ...shadows.sm,
  },
  quickActionPressed: {
    opacity: 0.9,
    borderColor: `${colors.primary}66`,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  infoValue: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  amenityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  amenityText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  deactivate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  deactivatePressed: {
    opacity: 0.85,
  },
  deactivateDisabled: {
    opacity: 0.6,
  },
  deactivateText: {
    ...typography.bodyStrong,
    color: '#DC2626',
    fontWeight: '700',
  },
  heroSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroSkeletonText: {
    flex: 1,
    gap: spacing.sm,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.card,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
  },
});
