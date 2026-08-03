import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react-native';
import { EmptyState, SkeletonCard, Timeline, type TimelineGroup } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { spacing } from '../../theme';
import { formatHistoryValue, HISTORY_ACTION_LABEL_KEYS } from '../../utils/memberHistory';

type MemberHistoryTabProps = {
  memberId: string;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
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

export function MemberHistoryTab({ memberId }: MemberHistoryTabProps) {
  const { t } = useTranslation();
  const history = useMemberStore(state => state.history);
  const historyLoading = useMemberStore(state => state.historyLoading);
  const loadHistory = useMemberStore(state => state.loadHistory);

  useEffect(() => {
    void loadHistory(memberId);
  }, [loadHistory, memberId]);

  const groups = useMemo<TimelineGroup[]>(() => {
    const result: TimelineGroup[] = [];
    history.forEach(entry => {
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
          date: formatDate(entry.changedAt),
        }),
        description: formatHistoryValue(entry),
      });
    });
    return result;
  }, [history, t]);

  if (historyLoading && history.length === 0) {
    return (
      <View style={styles.skeletonStack}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (history.length === 0) {
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
      <Timeline groups={groups} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.md,
  },
  skeletonStack: {
    gap: spacing.md,
  },
});
