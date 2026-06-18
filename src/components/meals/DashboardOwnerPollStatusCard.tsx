import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollSlot, UUID } from '../../api/types';
import { Button } from '../ui';
import { Card } from '../ui/Card';
import { useOwnerMealPollStatus } from '../../hooks/useOwnerMealPollStatus';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMenuDate, tomorrowIsoDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type DashboardOwnerPollStatusCardProps = {
  spaceId: UUID;
};

function MealHeadcountRow({ polls }: { polls: MealPollSlot[] }) {
  const { t } = useTranslation();

  return (
    <View style={styles.headcountRow}>
      {polls.map(poll => (
        <View key={poll.id} style={styles.headcountChip}>
          <Text style={styles.headcountLabel}>{t(mealTypeLabelKey(poll.mealType))}</Text>
          <Text style={styles.headcountValue}>{poll.responseCount}</Text>
        </View>
      ))}
    </View>
  );
}

type ResponseSummaryProps = {
  respondedCount: number;
  eligibleCount: number;
  pendingCount: number;
  complete: boolean;
};

function ResponseSummary({
  respondedCount,
  eligibleCount,
  pendingCount,
  complete,
}: ResponseSummaryProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.summarySection}>
      <Text style={styles.summaryLine}>
        {t('dashboard.pollStatus.membersResponded', {
          responded: respondedCount,
          total: eligibleCount,
        })}
      </Text>
      {!complete && pendingCount > 0 ? (
        <Text style={styles.pendingLine}>
          {t('dashboard.pollStatus.pendingMembers', { count: pendingCount })}
        </Text>
      ) : null}
      {complete ? (
        <Text style={styles.readyLine}>{t('dashboard.pollStatus.headcountReady')}</Text>
      ) : null}
    </View>
  );
}

export function DashboardOwnerPollStatusCard({ spaceId }: DashboardOwnerPollStatusCardProps) {
  const { t, i18n } = useTranslation();
  const menuDate = tomorrowIsoDate();
  const status = useOwnerMealPollStatus(spaceId, menuDate, true);

  const handleViewDetails = useCallback(() => {
    navigateMainStack('MenuPlanning', { spaceId, menuDate });
  }, [menuDate, spaceId]);

  const handleRemindMembers = useCallback(() => {
    navigateMainStack('MenuSharePreview', { spaceId, menuDate });
  }, [menuDate, spaceId]);

  if (status.loading || !status.hasOpenPolls) {
    return null;
  }

  const complete = status.allResponded;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('dashboard.pollStatus.title')}</Text>
      <Text style={styles.date}>{formatMenuDate(menuDate, i18n.language)}</Text>

      <MealHeadcountRow polls={status.openPolls} />

      <ResponseSummary
        respondedCount={status.respondedCount}
        eligibleCount={status.eligibleCount}
        pendingCount={status.pendingCount}
        complete={complete}
      />

      {complete ? (
        <Button
          label={t('dashboard.pollStatus.viewSummary')}
          onPress={handleViewDetails}
          style={styles.action}
        />
      ) : (
        <>
          <Button
            label={t('dashboard.pollStatus.remindMembers')}
            onPress={handleRemindMembers}
            style={styles.action}
          />
          <Button
            label={t('dashboard.pollStatus.viewDetails')}
            onPress={handleViewDetails}
            variant="secondary"
            style={styles.action}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { ...typography.h3, marginBottom: spacing.xs },
  date: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  headcountRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headcountChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  headcountLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  headcountValue: {
    ...typography.h1,
    color: colors.textPrimary,
    lineHeight: 36,
  },
  summarySection: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLine: {
    ...typography.body,
    color: colors.muted,
  },
  pendingLine: {
    ...typography.body,
    color: colors.muted,
  },
  readyLine: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  action: { marginTop: spacing.sm },
});
