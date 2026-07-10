import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardMessOperations as MessOps } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardMessOperationsProps = {
  operations: MessOps;
  onMembersPress?: () => void;
  onMenusPress?: () => void;
  onPollsPress?: () => void;
  onHeadcountPress?: () => void;
};

function OperationCard({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, styles.cardPressable, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button">
      {content}
    </Pressable>
  );
}

export function DashboardMessOperations({
  operations,
  onMembersPress,
  onMenusPress,
  onPollsPress,
  onHeadcountPress,
}: DashboardMessOperationsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={t('dashboard.messOperations.title')} />
      <View style={styles.row}>
        <OperationCard
          value={String(operations.membersReceivingMeals)}
          label={t('dashboard.messOperations.membersReceivingMeals')}
          onPress={onMembersPress}
        />
        <OperationCard
          value={String(operations.menusPublishedThisMonth)}
          label={t('dashboard.messOperations.menusPublished')}
          onPress={onMenusPress}
        />
        <OperationCard
          value={
            operations.todaysHeadcount != null ? String(operations.todaysHeadcount) : '—'
          }
          label={t('dashboard.messOperations.todaysHeadcount')}
          onPress={onHeadcountPress}
        />
      </View>
      {operations.openPollsCount > 0 || operations.pollEligibleCount > 0 ? (
        <Pressable
          onPress={onPollsPress}
          disabled={!onPollsPress}
          style={({ pressed }) => [styles.pollBanner, pressed && onPollsPress && styles.cardPressed]}>
          <Text style={styles.pollText}>
            {operations.pollEligibleCount > 0
              ? t('dashboard.messOperations.pollBanner', {
                  open: operations.openPollsCount,
                  responded: operations.pollRespondedCount,
                  eligible: operations.pollEligibleCount,
                })
              : t('dashboard.messOperations.openPollsCount', {
                  count: operations.openPollsCount,
                })}
          </Text>
          {onPollsPress ? <Text style={styles.pollChevron}>›</Text> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  },
  cardPressable: {},
  cardPressed: {
    opacity: 0.88,
    borderColor: colors.primary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 18,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  chevron: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xxs,
    fontSize: 14,
    fontWeight: '300',
    color: colors.muted,
  },
  pollBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pollText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  pollChevron: {
    fontSize: 16,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
});
