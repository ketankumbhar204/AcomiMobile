import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealType } from '../../api/types';
import { PlanningChip } from './PlanningChip';
import { Card } from '../ui/Card';
import { colors, radius, spacing, typography } from '../../theme';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type DailyMenuSlotCardProps = {
  menu?: DailyMenuResponse | null;
  mealType: MealType;
  onAddCombo?: () => void;
  onAddItems?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onClosePoll?: () => void;
  pollStatus?: 'OPEN' | 'CLOSED' | null;
  pollResponseCount?: number;
  pollActionLoading?: boolean;
  onPublish?: () => void;
  publishing?: boolean;
};

function inferEntryType(option: DailyMenuResponse['options'][number]): 'COMBO' | 'ITEM' {
  if (option.entryType) {
    return option.entryType;
  }
  if (option.itemId) {
    return 'ITEM';
  }
  return 'COMBO';
}

export function DailyMenuSlotCard({
  menu,
  mealType,
  onAddCombo,
  onAddItems,
  onEdit,
  onShare,
  onClosePoll,
  pollStatus,
  pollResponseCount = 0,
  pollActionLoading = false,
  onPublish,
  publishing = false,
}: DailyMenuSlotCardProps) {
  const { t } = useTranslation();
  const published = menu?.status === 'PUBLISHED';
  const draft = menu?.status === 'DRAFT';
  const options = menu?.options?.filter(option => option.isAvailable) ?? [];
  const comboOptions = options.filter(option => inferEntryType(option) === 'COMBO');
  const itemOptions = options.filter(option => inferEntryType(option) === 'ITEM');
  const hasPlan = options.length > 0;

  const statusLabel = published
    ? t('meals.menu.published')
    : draft
      ? t('meals.menu.draft')
      : t('meals.menu.notPlanned');

  const statusStyle = published ? styles.published : draft ? styles.draft : styles.notPlanned;
  const canPublish = draft && hasPlan && onPublish;

  return (
    <Card style={styles.card}>
      <Pressable onPress={hasPlan ? onEdit : undefined} disabled={!hasPlan || !onEdit}>
        <View style={styles.header}>
          <Text style={styles.slotTitle}>{t(mealTypeLabelKey(mealType))}</Text>
          <Text style={[styles.status, statusStyle]}>{statusLabel}</Text>
        </View>

        <Text style={styles.plannedLabel}>{t('meals.menu.plannedEntries')}</Text>

        {!hasPlan ? (
          <Text style={styles.empty}>{t('meals.menu.noItemsYet')}</Text>
        ) : (
          <>
            {comboOptions.length > 0 ? (
              <View style={styles.plannedGroup}>
                <Text style={styles.plannedGroupLabel}>{t('meals.library.combos')}</Text>
                <View style={styles.chipRow}>
                  {comboOptions.map((option, index) => (
                    <PlanningChip
                      key={`combo-${index}`}
                      label={option.label}
                      variant="COMBO"
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {itemOptions.length > 0 ? (
              <View style={styles.plannedGroup}>
                <Text style={styles.plannedGroupLabel}>{t('meals.library.items')}</Text>
                <View style={styles.chipRow}>
                  {itemOptions.map((option, index) => (
                    <PlanningChip
                      key={`item-${index}`}
                      label={option.label}
                      variant="ITEM"
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {onEdit ? (
              <Text style={styles.editHint}>{t('meals.planning.tapToEdit')}</Text>
            ) : null}
          </>
        )}
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        {onAddCombo ? (
          <Pressable style={[styles.actionButton, styles.actionButtonPrimary]} onPress={onAddCombo}>
            <Text style={styles.actionButtonTextPrimary}>{t('meals.menu.addComboShort')}</Text>
          </Pressable>
        ) : null}
        {onAddItems ? (
          <Pressable style={[styles.actionButton, styles.actionButtonSecondary]} onPress={onAddItems}>
            <Text style={styles.actionButtonTextSecondary}>{t('meals.menu.addItemsShort')}</Text>
          </Pressable>
        ) : null}
      </View>

      {published && pollStatus === 'OPEN' ? (
        <View style={styles.shareFooter}>
          <Text style={styles.pollStatusOpen}>
            {t('meals.poll.pollOpen', { count: pollResponseCount })}
          </Text>
          {onShare ? (
            <Pressable style={styles.shareLink} onPress={onShare}>
              <Text style={styles.shareLinkText}>{t('meals.planning.shareSlotAgain')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : published && onShare ? (
        <Pressable style={styles.shareLinkCentered} onPress={onShare}>
          <Text style={styles.shareLinkText}>{t('meals.planning.shareSlot')}</Text>
        </Pressable>
      ) : null}

      {published && pollStatus === 'CLOSED' ? (
        <Text style={styles.pollStatusClosed}>{t('meals.poll.pollClosed')}</Text>
      ) : null}

      {published && pollStatus !== 'OPEN' && pollStatus !== 'CLOSED' && onShare ? (
        <Text style={styles.pollHint}>{t('meals.poll.shareToOpen')}</Text>
      ) : null}

      {published && pollStatus === 'OPEN' && onClosePoll ? (
        <Pressable
          style={[styles.pollCloseButton, pollActionLoading && styles.publishButtonDisabled]}
          onPress={onClosePoll}
          disabled={pollActionLoading}>
          <Text style={styles.pollCloseButtonText}>
            {pollActionLoading ? t('meals.poll.submitting') : t('meals.poll.closePoll')}
          </Text>
        </Pressable>
      ) : null}

      {canPublish ? (
        <Pressable
          style={[styles.publishButton, publishing && styles.publishButtonDisabled]}
          onPress={onPublish}
          disabled={publishing}>
          <Text style={styles.publishButtonText}>
            {publishing ? t('meals.menu.publishing') : t('meals.menu.publishShort')}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slotTitle: { ...typography.bodyStrong },
  status: { ...typography.caption, fontWeight: '600' },
  published: { color: colors.success },
  draft: { color: '#D97706' },
  notPlanned: { color: colors.muted },
  plannedLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  empty: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  plannedGroup: { marginBottom: spacing.sm },
  plannedGroupLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  editHint: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonTextPrimary: { ...typography.bodyStrong, color: colors.white, fontSize: 14 },
  actionButtonTextSecondary: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 14 },
  publishButton: {
    marginTop: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  publishButtonDisabled: { opacity: 0.6 },
  publishButtonText: { ...typography.bodyStrong, color: colors.white, fontSize: 14 },
  shareFooter: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  shareLink: {
    paddingVertical: spacing.xs,
  },
  shareLinkCentered: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  shareLinkText: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 14 },
  pollStatusOpen: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  pollStatusClosed: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  pollHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  pollCloseButton: {
    marginTop: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  pollCloseButtonText: { ...typography.bodyStrong, color: colors.muted, fontSize: 14 },
});
