import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardAttentionItem, UUID } from '../../api/types';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { navigateToPaymentsTab } from '../../navigation/navigationRef';
import { colors, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { Button, Card } from '../ui';

type DashboardAttentionCardProps = {
  spaceId: UUID;
  attention: DashboardAttentionItem;
};

function attentionIcon(kind: DashboardAttentionItem['kind']): string {
  switch (kind) {
    case 'not_planned':
    case 'partial_planned':
      return '⚠';
    case 'ready_to_share':
      return '📢';
    case 'poll_open':
      return '🟢';
    case 'payments_overdue':
      return '💳';
    default:
      return '⚠';
  }
}

export function DashboardAttentionCard({ spaceId, attention }: DashboardAttentionCardProps) {
  const { t } = useTranslation();
  const tomorrow = tomorrowIsoDate();

  const titleKey =
    attention.kind === 'partial_planned'
      ? (attention.missingMealTypes?.length ?? 0) === 1
        ? 'dashboard.attention.partial_planned.titleSingle'
        : 'dashboard.attention.partial_planned.titleMultiple'
      : `dashboard.attention.${attention.kind}.title`;

  const bodyKey = `dashboard.attention.${attention.kind}.body`;

  const titleParams =
    attention.kind === 'partial_planned' && (attention.missingMealTypes?.length ?? 0) === 1
      ? {
          meal: t(mealTypeLabelKey(attention.missingMealTypes![0])),
        }
      : attention.kind === 'payments_overdue'
        ? {
            count: attention.overdueCount ?? 0,
            amount:
              formatComboPrice(
                attention.overdueAmount ?? null,
                attention.currencyCode ?? 'INR',
              ) ?? '—',
          }
        : undefined;

  const bodyParams = {
    scheduled: attention.scheduledCount,
    total: attention.totalMeals,
    responded: attention.respondedCount,
    eligible: attention.eligibleCount,
    count: attention.overdueCount,
    amount:
      formatComboPrice(attention.overdueAmount ?? null, attention.currencyCode ?? 'INR') ?? '—',
  };

  const onPrimaryAction = useCallback(() => {
    switch (attention.kind) {
      case 'not_planned':
      case 'partial_planned':
        navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrow });
        return;
      case 'ready_to_share':
      case 'poll_open':
        navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow });
        return;
      case 'payments_overdue':
        navigateToPaymentsTab(spaceId);
        return;
      default:
        return;
    }
  }, [attention.kind, spaceId, tomorrow]);

  const actionLabel = t(`dashboard.attention.${attention.kind}.action`);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{attentionIcon(attention.kind)}</Text>
        <Text style={styles.title}>{t(titleKey, titleParams)}</Text>
      </View>
      <Text style={styles.body}>{t(bodyKey, bodyParams)}</Text>
      <Button label={actionLabel} onPress={onPrimaryAction} style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderColor: '#F59E0B55',
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 18,
    lineHeight: 24,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  button: {
    alignSelf: 'flex-start',
  },
});
