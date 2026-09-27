import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react-native';
import type { OccupancyHistoryEvent } from '../../api/types';
import { EmptyState, InventoryListSkeleton, Timeline, type TimelineGroup } from '../ui';
import { useMemberOccupancies } from '../../hooks/useMemberOccupancies';
import { useMemberStore } from '../../store/memberStore';
import { colors, spacing, typography } from '../../theme';
import { formatHistoryValue, HISTORY_ACTION_LABEL_KEYS } from '../../utils/memberHistory';
import {
  occupancyById,
  occupancyLocationLabel,
  resolveOccupancyHistoryEntries,
} from '../../utils/occupancyHistoryTimeline';
import { formatOccupancyAllocatedDate } from '../../utils/occupancyRules';

type MemberHistoryTabProps = {
  spaceId: string;
  memberId: string;
};

const EVENT_ACCENT: Record<OccupancyHistoryEvent, string> = {
  ALLOCATED: colors.primary,
  MOVE_IN: colors.primary,
  RESERVED: colors.warning,
  TRANSFERRED: colors.info,
  VACATED: colors.muted,
  RESERVATION_CANCELLED: colors.danger,
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${formatOccupancyAllocatedDate(value)} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function monthKey(value: string): { key: string; label: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { key: 'unknown', label: '—' };
  }
  return {
    key: `${date.getFullYear()}-${date.getMonth()}`,
    label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  };
}

export function MemberHistoryTab({ spaceId, memberId }: MemberHistoryTabProps) {
  const { t } = useTranslation();
  const memberHistory = useMemberStore(state => state.history);
  const historyLoading = useMemberStore(state => state.historyLoading);
  const loadHistory = useMemberStore(state => state.loadHistory);
  const { data, loading: occupancyLoading } = useMemberOccupancies(spaceId, memberId);

  useEffect(() => {
    void loadHistory(memberId);
  }, [loadHistory, memberId]);

  const occupancyMap = useMemo(() => occupancyById(data), [data]);
  const occupancyEntries = useMemo(() => resolveOccupancyHistoryEntries(data), [data]);

  const occupancyGroups = useMemo<TimelineGroup[]>(() => {
    const result: TimelineGroup[] = [];
    occupancyEntries.forEach(entry => {
      const { key, label } = monthKey(entry.performedAt);
      let group = result.find(candidate => candidate.key === key);
      if (!group) {
        group = { key, label, items: [] };
        result.push(group);
      }
      const location = occupancyLocationLabel(occupancyMap.get(entry.occupancyId));
      group.items.push({
        id: entry.historyId,
        title: t(`occupancy.history.${entry.eventType}`),
        meta: formatDateTime(entry.performedAt),
        description: entry.remarks ?? location,
        accent: EVENT_ACCENT[entry.eventType] ?? colors.primary,
      });
    });
    return result;
  }, [occupancyEntries, occupancyMap, t]);

  const profileGroups = useMemo<TimelineGroup[]>(() => {
    const result: TimelineGroup[] = [];
    memberHistory.forEach(entry => {
      const { key, label } = monthKey(entry.changedAt);
      let group = result.find(candidate => candidate.key === key);
      if (!group) {
        group = { key, label, items: [] };
        result.push(group);
      }
      group.items.push({
        id: entry.historyId,
        title: t(HISTORY_ACTION_LABEL_KEYS[entry.action]),
        meta: t('membership.history.meta', {
          name: entry.changedByName,
          date: formatDateTime(entry.changedAt),
        }),
        description: formatHistoryValue(entry),
      });
    });
    return result;
  }, [memberHistory, t]);

  const loading =
    (occupancyLoading && !data) || (historyLoading && memberHistory.length === 0 && !data);

  if (loading) {
    return (
      <View style={styles.skeletonStack}>
        <InventoryListSkeleton cards={2} />
      </View>
    );
  }

  if (occupancyGroups.length === 0 && profileGroups.length === 0) {
    return (
      <EmptyState
        title={t('membership.history.emptyTitle')}
        description={t('membership.history.emptyDescription')}
        Icon={History}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      {occupancyGroups.length > 0 ? (
        <Timeline groups={occupancyGroups} />
      ) : null}
      {profileGroups.length > 0 ? (
        <View style={styles.profileBlock}>
          <Text style={styles.profileTitle}>
            {t('membership.history.profileChanges', {
              defaultValue: 'Profile changes',
            })}
          </Text>
          <Timeline groups={profileGroups} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  skeletonStack: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  profileBlock: {
    gap: spacing.sm,
  },
  profileTitle: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
});
