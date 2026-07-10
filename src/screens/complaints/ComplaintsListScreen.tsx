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
import type { ComplaintResponse, ComplaintStatus } from '../../api/types';
import { ComplaintStatusBadge } from '../../components/complaints';
import { Button, EmptyState, ListFilterChips, SkeletonCard } from '../../components/ui';
import { useComplaintsList } from '../../hooks/useComplaintsList';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { canManageComplaints, canRaiseComplaint } from '../../utils/complaintPermissions';
import { formatComplaintDateTime } from '../../utils/complaintStatus';

type Route = RouteProp<SpaceTabParamList, 'Complaints'>;
type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Complaints'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type StatusFilter = 'ALL' | ComplaintStatus;

function ComplaintRow({
  item,
  onPress,
}: {
  item: ComplaintResponse;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <ComplaintStatusBadge status={item.status} />
      </View>
      <Text style={styles.rowMeta} numberOfLines={1}>
        {t(`complaints.category.${item.category}`)} · {t(`complaints.priority.${item.priority}`)}
      </Text>
      {item.createdByMemberName ? (
        <Text style={styles.rowMeta} numberOfLines={1}>
          {item.createdByMemberName}
        </Text>
      ) : null}
      <Text style={styles.rowDate}>{formatComplaintDateTime(item.createdAt)}</Text>
    </Pressable>
  );
}

export function ComplaintsListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);

  const permissions = useSpacePermissions(spaceId);
  const manage = canManageComplaints(permissions.membershipRole);
  const raise = canRaiseComplaint(permissions.membershipRole, permissions.canRaiseComplaint);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
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

  const filterOptions = useMemo(
    () =>
      (['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'] as StatusFilter[]).map(
        id => ({
          id,
          label:
            id === 'ALL'
              ? t('complaints.filters.all')
              : t(`complaints.status.${id}`),
        }),
      ),
    [t],
  );

  const complaints = data?.complaints ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <ListFilterChips
          options={filterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        {raise ? (
          <Button
            label={t('complaints.raise')}
            onPress={() => navigation.navigate('RaiseComplaint', { spaceId })}
          />
        ) : null}
      </View>

      {loading && complaints.length === 0 ? (
        <View style={styles.pad}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && complaints.length === 0 ? (
        <EmptyState
          title={t('complaints.empty.title')}
          description={t('complaints.empty.description')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {data ? (
            <Text style={styles.counts}>
              {t('complaints.counts', {
                total: data.totalCount,
                open: data.openCount,
                inProgress: data.inProgressCount,
              })}
            </Text>
          ) : null}
          {complaints.map(item => (
            <ComplaintRow
              key={item.complaintId}
              item={item}
              onPress={() =>
                navigation.navigate('ComplaintDetail', {
                  spaceId,
                  complaintId: item.complaintId,
                })
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  pad: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  counts: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  rowTitle: {
    ...typography.h3,
    flex: 1,
  },
  rowMeta: {
    ...typography.caption,
  },
  rowDate: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  error: {
    ...typography.body,
    color: '#B91C1C',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
});
