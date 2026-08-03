import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CompositeNavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  Circle,
  CirclePlus,
  Clock3,
  MessageSquareWarning,
  TriangleAlert,
} from 'lucide-react-native';
import type { ComplaintResponse, ComplaintStatus } from '../../api/types';
import { ComplaintListCard } from '../../components/complaints';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import { DashboardStatCard } from '../../components/dashboard/shared/DashboardStatCard';
import { MealFormHero } from '../../components/meals/MealFormHero';
import {
  EmptyState,
  FAB,
  ListFilterChips,
  ListSearchBar,
  SkeletonCard,
} from '../../components/ui';
import { useComplaintsList } from '../../hooks/useComplaintsList';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { colors, shadows, spacing, typography } from '../../theme';
import { canManageComplaints, canRaiseComplaint } from '../../utils/complaintPermissions';

type Route = RouteProp<SpaceTabParamList, 'Complaints'>;
type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Complaints'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type StatusFilter = 'ALL' | ComplaintStatus;

function matchesSearch(item: ComplaintResponse, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [
    item.title,
    item.description,
    item.createdByMemberName,
    item.assignedToName,
    item.category,
    item.priority,
    item.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function ComplaintsListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const spaceId = useActiveSpaceId(route.params.spaceId);
  useSpaceTabHeader(spaceId);

  const permissions = useSpacePermissions(spaceId);
  const manage = canManageComplaints(permissions.membershipRole);
  const raise = canRaiseComplaint(permissions.membershipRole, permissions.canRaiseComplaint);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const listParams = useMemo(
    () => ({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      mine: manage ? undefined : true,
    }),
    [manage, statusFilter],
  );

  const { data, loading, error, reload } = useComplaintsList(spaceId, listParams);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const complaints = useMemo(() => data?.complaints ?? [], [data?.complaints]);
  const filteredComplaints = useMemo(
    () => complaints.filter(item => matchesSearch(item, searchQuery)),
    [complaints, searchQuery],
  );

  const urgentCount = useMemo(
    () =>
      complaints.filter(
        item =>
          item.priority === 'URGENT' &&
          item.status !== 'CLOSED' &&
          item.status !== 'CANCELLED' &&
          item.status !== 'RESOLVED',
      ).length,
    [complaints],
  );

  const filterOptions = useMemo(
    () =>
      (['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'] as StatusFilter[]).map(
        id => ({
          id,
          label:
            id === 'ALL'
              ? t('complaints.filters.all')
              : t(`complaints.status.${id}`),
          badge:
            id === 'OPEN'
              ? data?.openCount
              : id === 'IN_PROGRESS'
                ? data?.inProgressCount
                : id === 'RESOLVED'
                  ? data?.resolvedCount
                  : undefined,
          tone:
            id === 'OPEN'
              ? ('warning' as const)
              : id === 'IN_PROGRESS'
                ? ('info' as const)
                : id === 'CANCELLED'
                  ? ('danger' as const)
                  : ('primary' as const),
        }),
      ),
    [data?.inProgressCount, data?.openCount, data?.resolvedCount, t],
  );

  const openRaise = useCallback(() => {
    navigation.navigate('RaiseComplaint', { spaceId });
  }, [navigation, spaceId]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.list}
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <MealFormHero
          icon={MessageSquareWarning}
          eyebrow={t('complaints.hero.eyebrow', { defaultValue: 'Issue tracking' })}
          heading={t('complaints.hero.heading', { defaultValue: 'Complaints' })}
          subheading={
            manage
              ? t('complaints.hero.subManage', {
                  defaultValue: 'Track open issues, urgency, and resolution progress.',
                })
              : t('complaints.hero.subMine', {
                  defaultValue: 'Follow your reported issues and updates.',
                })
          }
          accent="#B45309"
          soft={colors.warningTint}
          border="#FDE68A"
        />

        <View style={styles.stickyChrome}>
          <ListSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('complaints.search.placeholder', {
              defaultValue: 'Search title, member, or category',
            })}
          />
          <ListFilterChips
            options={filterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </View>

        {data ? (
          <View style={styles.statsBlock}>
            <DashboardSectionTitle
              title={t('complaints.stats.title', { defaultValue: 'At a glance' })}
            />
            <View style={styles.statsGrid}>
              <DashboardStatCard
                label={t('complaints.status.OPEN')}
                value={String(data.openCount)}
                icon={Circle}
                accent="#B45309"
                compact
                gridItem
                onPress={() => setStatusFilter('OPEN')}
              />
              <DashboardStatCard
                label={t('complaints.status.IN_PROGRESS')}
                value={String(data.inProgressCount)}
                icon={Clock3}
                accent="#2563EB"
                compact
                gridItem
                onPress={() => setStatusFilter('IN_PROGRESS')}
              />
              <DashboardStatCard
                label={t('complaints.status.RESOLVED')}
                value={String(data.resolvedCount)}
                icon={BadgeCheck}
                accent="#059669"
                compact
                gridItem
                onPress={() => setStatusFilter('RESOLVED')}
              />
              <DashboardStatCard
                label={t('complaints.priority.URGENT')}
                value={String(urgentCount)}
                icon={TriangleAlert}
                accent="#B91C1C"
                compact
                gridItem
              />
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && complaints.length === 0 ? (
          <View style={styles.skeletonBlock}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : null}

        {!loading && filteredComplaints.length === 0 ? (
          <View style={styles.emptyBlock}>
            <EmptyState
              Icon={MessageSquareWarning}
              title={
                searchQuery.trim()
                  ? t('complaints.empty.searchTitle', { defaultValue: 'No matching complaints' })
                  : t('complaints.empty.title')
              }
              description={
                searchQuery.trim()
                  ? t('complaints.empty.searchDescription', {
                      defaultValue: 'Try a different search or clear filters.',
                    })
                  : t('complaints.empty.description')
              }
            />
            {raise && !searchQuery.trim() ? (
              <Pressable
                onPress={openRaise}
                style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
                accessibilityRole="button"
                accessibilityLabel={t('complaints.raise')}>
                <CirclePlus size={18} color={colors.white} strokeWidth={2.2} />
                <Text style={styles.emptyCtaText}>{t('complaints.raise')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.cardsBlock}>
            <DashboardSectionTitle
              title={t('complaints.listTitle', {
                defaultValue: manage ? 'All complaints' : 'My complaints',
              })}
            />
            {filteredComplaints.map(item => (
              <ComplaintListCard
                key={item.complaintId}
                item={item}
                categoryLabel={t(`complaints.category.${item.category}`)}
                memberFallback={t('complaints.operator')}
                assignedLabel={t('complaints.fields.assigned', { defaultValue: 'Assigned' })}
                onPress={() =>
                  navigation.navigate('ComplaintDetail', {
                    spaceId,
                    complaintId: item.complaintId,
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {raise ? (
        <FAB onPress={openRaise} accessibilityLabel={t('complaints.raise')} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 100,
  },
  stickyChrome: {
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  statsBlock: {
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skeletonBlock: {
    gap: spacing.md,
  },
  cardsBlock: {
    gap: spacing.sm,
  },
  emptyBlock: {
    gap: spacing.md,
    alignItems: 'center',
  },
  emptyCta: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  emptyCtaPressed: {
    backgroundColor: colors.primaryHover,
  },
  emptyCtaText: {
    ...typography.bodyStrong,
    color: colors.white,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    ...typography.body,
    flex: 1,
    color: '#B91C1C',
  },
});
