import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmptyState, SkeletonCard } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
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

export function MemberHistoryTab({ memberId }: MemberHistoryTabProps) {
  const { t } = useTranslation();
  const history = useMemberStore(state => state.history);
  const historyLoading = useMemberStore(state => state.historyLoading);
  const loadHistory = useMemberStore(state => state.loadHistory);

  useEffect(() => {
    console.log('[MemberHistoryTab] first visit, load history', memberId);
    void loadHistory(memberId);
  }, [loadHistory, memberId]);

  if (historyLoading && history.length === 0) {
    return <SkeletonCard />;
  }

  if (history.length === 0) {
    return (
      <EmptyState
        title={t('membership.history.emptyTitle')}
        description={t('membership.history.emptyDescription')}
        icon="📋"
      />
    );
  }

  return (
    <View style={styles.list}>
      {history.map(entry => (
        <View key={entry.historyId} style={styles.card}>
          <Text style={styles.actionLabel}>
            {t(HISTORY_ACTION_LABEL_KEYS[entry.action])}
          </Text>
          <Text style={styles.valueText}>{formatHistoryValue(entry)}</Text>
          <Text style={styles.meta}>
            {t('membership.history.meta', {
              name: entry.changedByName,
              date: formatDate(entry.changedAt),
            })}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  actionLabel: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  valueText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
});
