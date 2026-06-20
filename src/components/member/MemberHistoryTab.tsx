import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, SkeletonCard } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { colors, spacing, typography } from '../../theme';
import { formatHistoryValue, HISTORY_ACTION_LABEL_KEYS } from '../../utils/memberHistory';
import { MemberDetailRow, MemberSectionTitle } from './MemberDetailRow';

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
    void loadHistory(memberId);
  }, [loadHistory, memberId]);

  if (historyLoading && history.length === 0) {
    return <SkeletonCard />;
  }

  if (history.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyTitle}>{t('membership.history.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('membership.history.emptyDescription')}</Text>
      </Card>
    );
  }

  return (
    <View>
      {history.map(entry => (
        <Card key={entry.historyId} style={styles.card}>
          <MemberDetailRow
            label={t('membership.history.actionLabel')}
            value={t(HISTORY_ACTION_LABEL_KEYS[entry.action])}
          />
          <MemberDetailRow
            label={t('membership.history.changeLabel')}
            value={formatHistoryValue(entry)}
          />
          <MemberDetailRow
            label={t('membership.notes.authorLabel')}
            value={entry.changedByName}
          />
          <MemberDetailRow
            label={t('membership.notes.dateLabel')}
            value={formatDate(entry.changedAt)}
            isLast
          />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
});
